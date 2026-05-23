---
slug: 'n8n-data-processing-automation'

title: "n8n Data Processing Automation: ETL, Analytics, and Real-Time Pipelines"
published: 2025-01-20
description: "Build powerful data processing workflows in n8n for ETL operations, data transformation, analytics, and real-time data pipelines with practical examples"
image: ""
tags: ["n8n", "ETL", "data-processing", "analytics", "automation", "pipeline"]
category: Data Engineering
draft: false

---

## Introduction: Data Processing with n8n

In the era of big data, organizations need robust systems to extract, transform, and load (ETL) data efficiently. n8n transforms complex data processing tasks into visual, manageable workflows that can handle everything from simple CSV transformations to real-time streaming analytics. This guide explores advanced data processing patterns and implementations using n8n.

## Core Data Processing Capabilities

### n8n's Data Processing Arsenal

1. **Data Sources**: 50+ database integrations
2. **File Formats**: JSON, CSV, XML, Excel, Binary
3. **Transformation Tools**: JavaScript/Python functions
4. **Stream Processing**: Real-time data handling
5. **Batch Operations**: Large-scale data processing
6. **Data Quality**: Validation and cleansing tools

## ETL Pipeline Implementation

### Example 1: Multi-Source Data Warehouse ETL

**Scenario**: Extract data from multiple sources, transform it according to business rules, and load into a data warehouse.

```json
{
  "name": "Enterprise ETL Pipeline",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 2 * * *",
        "timezone": "America/New_York"
      }
    },
    {
      "name": "Extract from PostgreSQL",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": `
          SELECT 
            o.order_id,
            o.customer_id,
            o.order_date,
            o.total_amount,
            c.customer_name,
            c.customer_segment,
            p.product_name,
            p.category,
            oi.quantity,
            oi.unit_price
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          JOIN order_items oi ON o.order_id = oi.order_id
          JOIN products p ON oi.product_id = p.id
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '1 day'
        `
      }
    },
    {
      "name": "Extract from MongoDB",
      "type": "n8n-nodes-base.mongoDb",
      "parameters": {
        "operation": "find",
        "collection": "user_events",
        "query": {
          "timestamp": {
            "$gte": "{{$now.minus(1, 'day').toISO()}}"
          }
        },
        "options": {
          "limit": 10000,
          "sort": { "timestamp": -1 }
        }
      }
    },
    {
      "name": "Extract from S3 CSV",
      "type": "n8n-nodes-base.aws",
      "parameters": {
        "service": "s3",
        "operation": "download",
        "bucket": "data-lake",
        "key": "daily-exports/{{$now.format('yyyy-MM-dd')}}/sales.csv"
      }
    },
    {
      "name": "Parse CSV",
      "type": "n8n-nodes-base.spreadsheetFile",
      "parameters": {
        "operation": "fromFile",
        "fileFormat": "csv",
        "options": {
          "headerRow": true,
          "delimiter": ",",
          "includeEmptyCells": false
        }
      }
    },
    {
      "name": "Transform Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Combine and transform data from multiple sources
          const postgresData = $items[0].json;
          const mongoData = $items[1].json;
          const csvData = $items[2].json;
          
          // Data transformation logic
          const transformedData = [];
          
          // Process PostgreSQL data
          postgresData.forEach(row => {
            const transformed = {
              // Dimensional modeling
              fact_key: generateFactKey(row),
              
              // Dimensions
              date_key: formatDateKey(row.order_date),
              customer_key: row.customer_id,
              product_key: generateProductKey(row),
              
              // Measures
              quantity: parseInt(row.quantity),
              unit_price: parseFloat(row.unit_price),
              total_amount: parseFloat(row.total_amount),
              discount_amount: calculateDiscount(row),
              tax_amount: calculateTax(row),
              
              // Calculated fields
              profit_margin: calculateProfitMargin(row),
              customer_lifetime_value: calculateCLV(row),
              
              // Metadata
              source_system: 'postgresql',
              etl_timestamp: new Date().toISOString(),
              data_quality_score: validateDataQuality(row)
            };
            
            transformedData.push(transformed);
          });
          
          // Process MongoDB event data
          mongoData.forEach(event => {
            const transformed = {
              event_key: event._id,
              user_key: event.userId,
              session_key: event.sessionId,
              event_type: event.type,
              event_timestamp: new Date(event.timestamp).toISOString(),
              
              // Parse event properties
              page_url: event.properties?.url,
              referrer: event.properties?.referrer,
              device_type: detectDeviceType(event.userAgent),
              browser: parseBrowser(event.userAgent),
              
              // Engagement metrics
              time_on_page: event.duration || 0,
              scroll_depth: event.scrollDepth || 0,
              clicks: event.clicks || 0,
              
              source_system: 'mongodb',
              etl_timestamp: new Date().toISOString()
            };
            
            transformedData.push(transformed);
          });
          
          // Helper functions
          function generateFactKey(row) {
            return crypto.createHash('md5')
              .update(\`\${row.order_id}-\${row.customer_id}-\${row.order_date}\`)
              .digest('hex');
          }
          
          function formatDateKey(date) {
            const d = new Date(date);
            return parseInt(\`\${d.getFullYear()}\${String(d.getMonth() + 1).padStart(2, '0')}\${String(d.getDate()).padStart(2, '0')}\`);
          }
          
          function calculateDiscount(row) {
            const listPrice = row.quantity * row.unit_price;
            return Math.max(0, listPrice - row.total_amount);
          }
          
          function calculateTax(row) {
            const taxRate = 0.08; // 8% tax rate
            return row.total_amount * taxRate;
          }
          
          function calculateProfitMargin(row) {
            const cost = row.unit_price * 0.6; // Assume 60% cost
            const profit = row.unit_price - cost;
            return (profit / row.unit_price) * 100;
          }
          
          function calculateCLV(row) {
            // Simplified CLV calculation
            return row.total_amount * 12 * 0.2; // Annual value * retention rate
          }
          
          function validateDataQuality(row) {
            let score = 100;
            if (!row.customer_id) score -= 20;
            if (!row.order_date) score -= 20;
            if (row.total_amount <= 0) score -= 30;
            if (!row.product_name) score -= 10;
            return score;
          }
          
          function detectDeviceType(userAgent) {
            if (/mobile/i.test(userAgent)) return 'mobile';
            if (/tablet/i.test(userAgent)) return 'tablet';
            return 'desktop';
          }
          
          function parseBrowser(userAgent) {
            if (/chrome/i.test(userAgent)) return 'Chrome';
            if (/firefox/i.test(userAgent)) return 'Firefox';
            if (/safari/i.test(userAgent)) return 'Safari';
            if (/edge/i.test(userAgent)) return 'Edge';
            return 'Other';
          }
          
          return transformedData.map(item => ({json: item}));
        `
      }
    },
    {
      "name": "Data Quality Check",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Comprehensive data quality validation
          const records = $items;
          const qualityReport = {
            totalRecords: records.length,
            validRecords: 0,
            invalidRecords: 0,
            warnings: [],
            errors: [],
            fieldStatistics: {}
          };
          
          const validatedRecords = [];
          
          records.forEach((record, index) => {
            const data = record.json;
            const issues = [];
            
            // Null checks
            const requiredFields = ['fact_key', 'date_key', 'customer_key'];
            requiredFields.forEach(field => {
              if (!data[field]) {
                issues.push({
                  type: 'error',
                  field: field,
                  message: \`Missing required field: \${field}\`,
                  recordIndex: index
                });
              }
            });
            
            // Data type validation
            if (typeof data.quantity !== 'number' || data.quantity < 0) {
              issues.push({
                type: 'error',
                field: 'quantity',
                message: 'Invalid quantity value',
                value: data.quantity
              });
            }
            
            if (typeof data.total_amount !== 'number' || data.total_amount < 0) {
              issues.push({
                type: 'error',
                field: 'total_amount',
                message: 'Invalid total amount',
                value: data.total_amount
              });
            }
            
            // Business rule validation
            if (data.unit_price * data.quantity > data.total_amount * 1.5) {
              issues.push({
                type: 'warning',
                message: 'Unusually high discount detected',
                discount: data.discount_amount
              });
            }
            
            // Date validation
            const dateKey = String(data.date_key);
            if (dateKey.length !== 8 || isNaN(parseInt(dateKey))) {
              issues.push({
                type: 'error',
                field: 'date_key',
                message: 'Invalid date key format',
                value: data.date_key
              });
            }
            
            // Add quality metadata
            data.quality_check = {
              passed: issues.filter(i => i.type === 'error').length === 0,
              warnings: issues.filter(i => i.type === 'warning').length,
              errors: issues.filter(i => i.type === 'error').length,
              timestamp: new Date().toISOString()
            };
            
            if (data.quality_check.passed) {
              qualityReport.validRecords++;
              validatedRecords.push({json: data});
            } else {
              qualityReport.invalidRecords++;
              qualityReport.errors.push(...issues.filter(i => i.type === 'error'));
            }
            
            qualityReport.warnings.push(...issues.filter(i => i.type === 'warning'));
          });
          
          // Calculate field statistics
          const fields = ['quantity', 'total_amount', 'profit_margin'];
          fields.forEach(field => {
            const values = validatedRecords
              .map(r => r.json[field])
              .filter(v => v !== null && v !== undefined);
            
            qualityReport.fieldStatistics[field] = {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((a, b) => a + b, 0) / values.length,
              nullCount: records.length - values.length
            };
          });
          
          // Store quality report
          await $setWorkflowStaticData('lastQualityReport', qualityReport);
          
          return validatedRecords;
        `
      }
    },
    {
      "name": "Load to Snowflake",
      "type": "n8n-nodes-base.snowflake",
      "parameters": {
        "operation": "insert",
        "database": "ANALYTICS",
        "schema": "DW",
        "table": "FACT_SALES",
        "columns": [
          "fact_key",
          "date_key",
          "customer_key",
          "product_key",
          "quantity",
          "unit_price",
          "total_amount",
          "discount_amount",
          "tax_amount",
          "profit_margin",
          "source_system",
          "etl_timestamp"
        ],
        "options": {
          "batchSize": 1000,
          "continueOnFail": false
        }
      }
    }
  ]
}
```

### Example 2: Real-Time Stream Processing

**Scenario**: Process real-time data streams from Kafka, transform events, and route to appropriate destinations.

```javascript
// Real-Time Stream Processing Pipeline
const streamProcessing = {
  name: "Real-Time Event Stream Processor",
  
  // Kafka consumer for real-time events
  kafkaConsumer: {
    type: "n8n-nodes-base.kafka",
    parameters: {
      topic: "events-stream",
      groupId: "n8n-processor",
      fromBeginning: false,
      sessionTimeout: 30000,
      autoCommit: true
    }
  },
  
  // Event parser and enrichment
  eventProcessor: {
    type: "n8n-nodes-base.function",
    code: `
      // Parse and enrich streaming events
      const event = JSON.parse($json.message);
      const enriched = {
        // Original event data
        ...event,
        
        // Event metadata
        eventId: generateEventId(),
        receivedAt: new Date().toISOString(),
        processingLatency: Date.now() - event.timestamp,
        
        // Enrichment from cache/database
        user: await enrichUser(event.userId),
        session: await getSessionData(event.sessionId),
        location: await geocodeIP(event.ipAddress),
        
        // Real-time calculations
        metrics: calculateMetrics(event),
        anomalyScore: detectAnomaly(event),
        category: classifyEvent(event)
      };
      
      async function enrichUser(userId) {
        // Check cache first
        const cached = await $getWorkflowStaticData(\`user_\${userId}\`);
        if (cached && cached.expires > Date.now()) {
          return cached.data;
        }
        
        // Fetch from database
        const user = await $db.query(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        
        // Cache for 5 minutes
        await $setWorkflowStaticData(\`user_\${userId}\`, {
          data: user,
          expires: Date.now() + 300000
        });
        
        return user;
      }
      
      async function getSessionData(sessionId) {
        // Get session from Redis
        const session = await $redis.get(\`session:\${sessionId}\`);
        return JSON.parse(session) || {
          startTime: event.timestamp,
          eventCount: 0,
          lastActivity: event.timestamp
        };
      }
      
      async function geocodeIP(ip) {
        try {
          const response = await $http.get(\`https://ipapi.co/\${ip}/json/\`);
          return {
            country: response.data.country_name,
            city: response.data.city,
            region: response.data.region,
            latitude: response.data.latitude,
            longitude: response.data.longitude
          };
        } catch (error) {
          return { country: 'Unknown', city: 'Unknown' };
        }
      }
      
      function calculateMetrics(event) {
        return {
          responseTime: event.responseTime || 0,
          errorRate: event.errors / (event.requests || 1),
          throughput: event.requests / ((event.endTime - event.startTime) / 1000),
          successRate: (event.requests - event.errors) / event.requests
        };
      }
      
      function detectAnomaly(event) {
        // Simple anomaly detection
        const thresholds = {
          responseTime: 2000,
          errorRate: 0.05,
          requestsPerSecond: 100
        };
        
        let score = 0;
        if (event.responseTime > thresholds.responseTime) score += 30;
        if (event.errorRate > thresholds.errorRate) score += 40;
        if (event.requestsPerSecond > thresholds.requestsPerSecond) score += 30;
        
        return score;
      }
      
      function classifyEvent(event) {
        const rules = [
          { condition: e => e.type === 'purchase', category: 'transaction' },
          { condition: e => e.type === 'login', category: 'authentication' },
          { condition: e => e.type === 'error', category: 'error' },
          { condition: e => e.anomalyScore > 50, category: 'anomaly' }
        ];
        
        for (const rule of rules) {
          if (rule.condition(event)) {
            return rule.category;
          }
        }
        return 'general';
      }
      
      function generateEventId() {
        return \`evt_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
      }
      
      return [{json: enriched}];
    `
  },
  
  // Stream router based on event type
  streamRouter: {
    type: "n8n-nodes-base.switch",
    parameters: {
      dataType: "expression",
      value1: "={{$json.category}}",
      rules: [
        {
          value2: "transaction",
          output: "transactionProcessor"
        },
        {
          value2: "anomaly",
          output: "anomalyHandler"
        },
        {
          value2: "error",
          output: "errorHandler"
        }
      ],
      fallbackOutput: "defaultProcessor"
    }
  },
  
  // Windowed aggregation
  windowedAggregator: {
    type: "n8n-nodes-base.function",
    code: `
      // Implement tumbling window aggregation
      const windowSize = 60000; // 1 minute windows
      const event = $json;
      
      // Get current window
      let windows = await $getWorkflowStaticData('aggregationWindows') || {};
      const windowKey = Math.floor(Date.now() / windowSize) * windowSize;
      
      if (!windows[windowKey]) {
        windows[windowKey] = {
          startTime: windowKey,
          endTime: windowKey + windowSize,
          events: [],
          metrics: {
            count: 0,
            sumResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Infinity,
            errors: 0,
            uniqueUsers: new Set()
          }
        };
      }
      
      const window = windows[windowKey];
      
      // Update window metrics
      window.events.push(event);
      window.metrics.count++;
      window.metrics.sumResponseTime += event.metrics.responseTime;
      window.metrics.maxResponseTime = Math.max(
        window.metrics.maxResponseTime,
        event.metrics.responseTime
      );
      window.metrics.minResponseTime = Math.min(
        window.metrics.minResponseTime,
        event.metrics.responseTime
      );
      if (event.category === 'error') window.metrics.errors++;
      window.metrics.uniqueUsers.add(event.userId);
      
      // Check if window is complete
      if (Date.now() > window.endTime) {
        // Finalize window
        const aggregated = {
          windowStart: new Date(window.startTime).toISOString(),
          windowEnd: new Date(window.endTime).toISOString(),
          eventCount: window.metrics.count,
          avgResponseTime: window.metrics.sumResponseTime / window.metrics.count,
          maxResponseTime: window.metrics.maxResponseTime,
          minResponseTime: window.metrics.minResponseTime,
          errorRate: window.metrics.errors / window.metrics.count,
          uniqueUsers: window.metrics.uniqueUsers.size,
          topEvents: getTopEvents(window.events)
        };
        
        // Clean up old windows
        const oldWindowThreshold = Date.now() - 3600000; // Keep 1 hour
        for (const key in windows) {
          if (parseInt(key) < oldWindowThreshold) {
            delete windows[key];
          }
        }
        
        await $setWorkflowStaticData('aggregationWindows', windows);
        
        return [{json: aggregated}];
      }
      
      await $setWorkflowStaticData('aggregationWindows', windows);
      
      function getTopEvents(events) {
        const counts = {};
        events.forEach(e => {
          counts[e.type] = (counts[e.type] || 0) + 1;
        });
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => ({ type, count }));
      }
      
      return [{json: { processing: true, windowKey }}];
    `
  }
};
```

## Data Transformation Patterns

### Example 3: Complex Data Transformation Pipeline

**Scenario**: Transform nested JSON data, flatten hierarchical structures, and apply business logic.

```javascript
// Advanced Data Transformation
const dataTransformation = {
  name: "Complex Data Transformer",
  
  // JSON transformation
  jsonTransformer: {
    type: "n8n-nodes-base.function",
    code: `
      // Transform nested JSON structures
      const input = $json;
      
      // Flatten nested objects
      function flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const [key, value] of Object.entries(obj)) {
          const newKey = prefix ? \`\${prefix}.\${key}\` : key;
          
          if (value === null || value === undefined) {
            flattened[newKey] = null;
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(flattened, flattenObject(value, newKey));
          } else if (Array.isArray(value)) {
            flattened[newKey] = value;
            flattened[\`\${newKey}_count\`] = value.length;
            
            // Flatten array of objects
            if (value.length > 0 && typeof value[0] === 'object') {
              value.forEach((item, index) => {
                Object.assign(flattened, 
                  flattenObject(item, \`\${newKey}[\${index}]\`)
                );
              });
            }
          } else {
            flattened[newKey] = value;
          }
        }
        
        return flattened;
      }
      
      // Pivot data
      function pivotData(data, rowKey, columnKey, valueKey) {
        const pivoted = {};
        
        data.forEach(item => {
          const row = item[rowKey];
          const column = item[columnKey];
          const value = item[valueKey];
          
          if (!pivoted[row]) {
            pivoted[row] = {};
          }
          pivoted[row][column] = value;
        });
        
        return Object.entries(pivoted).map(([key, values]) => ({
          [rowKey]: key,
          ...values
        }));
      }
      
      // Normalize data
      function normalizeData(data, config) {
        const normalized = { ...data };
        
        // Normalize strings
        if (config.normalizeStrings) {
          for (const [key, value] of Object.entries(normalized)) {
            if (typeof value === 'string') {
              normalized[key] = value.trim().toLowerCase();
            }
          }
        }
        
        // Normalize dates
        if (config.normalizeDates) {
          const dateFields = config.dateFields || [];
          dateFields.forEach(field => {
            if (normalized[field]) {
              normalized[field] = new Date(normalized[field]).toISOString();
            }
          });
        }
        
        // Normalize numbers
        if (config.normalizeNumbers) {
          for (const [key, value] of Object.entries(normalized)) {
            if (!isNaN(value) && value !== '') {
              normalized[key] = parseFloat(value);
            }
          }
        }
        
        return normalized;
      }
      
      // Apply transformations
      const flattened = flattenObject(input);
      const normalized = normalizeData(flattened, {
        normalizeStrings: true,
        normalizeDates: true,
        normalizeNumbers: true,
        dateFields: ['created_at', 'updated_at', 'order_date']
      });
      
      // Add derived fields
      const transformed = {
        ...normalized,
        
        // Calculated fields
        total_value: (normalized.quantity || 0) * (normalized.unit_price || 0),
        days_since_order: Math.floor(
          (Date.now() - new Date(normalized.order_date).getTime()) / 86400000
        ),
        
        // Categorization
        value_category: categorizeValue(normalized.total_amount),
        customer_segment: segmentCustomer(normalized),
        
        // Flags
        is_high_value: normalized.total_amount > 1000,
        is_recent: normalized.days_since_order < 30,
        needs_review: detectReviewNeeded(normalized),
        
        // Metadata
        transformation_timestamp: new Date().toISOString(),
        transformation_version: '2.0'
      };
      
      function categorizeValue(amount) {
        if (amount > 10000) return 'enterprise';
        if (amount > 1000) return 'premium';
        if (amount > 100) return 'standard';
        return 'basic';
      }
      
      function segmentCustomer(data) {
        const recency = data.days_since_order;
        const frequency = data.order_count || 1;
        const monetary = data.total_amount;
        
        // RFM segmentation
        let score = 0;
        if (recency < 30) score += 3;
        else if (recency < 90) score += 2;
        else score += 1;
        
        if (frequency > 10) score += 3;
        else if (frequency > 5) score += 2;
        else score += 1;
        
        if (monetary > 5000) score += 3;
        else if (monetary > 1000) score += 2;
        else score += 1;
        
        if (score >= 8) return 'champion';
        if (score >= 6) return 'loyal';
        if (score >= 4) return 'potential';
        return 'new';
      }
      
      function detectReviewNeeded(data) {
        const conditions = [
          data.total_amount > 5000,
          data.discount_percentage > 50,
          data.quantity > 100,
          data.is_first_order && data.total_amount > 1000
        ];
        
        return conditions.filter(Boolean).length >= 2;
      }
      
      return [{json: transformed}];
    `
  },
  
  // Data type conversion
  typeConverter: {
    type: "n8n-nodes-base.function",
    code: `
      // Comprehensive type conversion
      const data = $json;
      const schema = {
        id: 'integer',
        name: 'string',
        email: 'email',
        phone: 'phone',
        date: 'date',
        amount: 'decimal',
        is_active: 'boolean',
        tags: 'array',
        metadata: 'json',
        binary_data: 'base64'
      };
      
      const converted = {};
      
      for (const [field, targetType] of Object.entries(schema)) {
        const value = data[field];
        
        if (value === null || value === undefined) {
          converted[field] = null;
          continue;
        }
        
        switch (targetType) {
          case 'integer':
            converted[field] = parseInt(value, 10);
            break;
            
          case 'decimal':
            converted[field] = parseFloat(value);
            break;
            
          case 'string':
            converted[field] = String(value).trim();
            break;
            
          case 'email':
            const email = String(value).toLowerCase().trim();
            converted[field] = validateEmail(email) ? email : null;
            break;
            
          case 'phone':
            converted[field] = formatPhoneNumber(value);
            break;
            
          case 'date':
            converted[field] = new Date(value).toISOString();
            break;
            
          case 'boolean':
            converted[field] = ['true', '1', 'yes', 'on'].includes(
              String(value).toLowerCase()
            );
            break;
            
          case 'array':
            if (Array.isArray(value)) {
              converted[field] = value;
            } else if (typeof value === 'string') {
              converted[field] = value.split(',').map(v => v.trim());
            } else {
              converted[field] = [value];
            }
            break;
            
          case 'json':
            if (typeof value === 'string') {
              try {
                converted[field] = JSON.parse(value);
              } catch {
                converted[field] = { raw: value };
              }
            } else {
              converted[field] = value;
            }
            break;
            
          case 'base64':
            if (Buffer.isBuffer(value)) {
              converted[field] = value.toString('base64');
            } else {
              converted[field] = Buffer.from(String(value)).toString('base64');
            }
            break;
            
          default:
            converted[field] = value;
        }
      }
      
      function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
      
      function formatPhoneNumber(phone) {
        const cleaned = String(phone).replace(/\D/g, '');
        if (cleaned.length === 10) {
          return \`(\${cleaned.slice(0, 3)}) \${cleaned.slice(3, 6)}-\${cleaned.slice(6)}\`;
        }
        return cleaned;
      }
      
      return [{json: converted}];
    `
  }
};
```

## Data Quality and Validation

### Example 4: Data Quality Framework

**Scenario**: Implement comprehensive data quality checks with profiling, validation, and cleansing.

```javascript
// Data Quality Management System
const dataQualitySystem = {
  name: "Data Quality Framework",
  
  // Data profiler
  dataProfiler: {
    type: "n8n-nodes-base.function",
    code: `
      // Profile dataset characteristics
      const dataset = $items.map(item => item.json);
      
      const profile = {
        overview: {
          recordCount: dataset.length,
          fieldCount: Object.keys(dataset[0] || {}).length,
          sizeBytes: JSON.stringify(dataset).length,
          timestamp: new Date().toISOString()
        },
        fields: {},
        patterns: {},
        anomalies: []
      };
      
      // Analyze each field
      const fields = Object.keys(dataset[0] || {});
      
      fields.forEach(field => {
        const values = dataset.map(row => row[field]);
        const nonNullValues = values.filter(v => v !== null && v !== undefined);
        
        profile.fields[field] = {
          // Basic statistics
          count: values.length,
          nullCount: values.length - nonNullValues.length,
          nullPercentage: ((values.length - nonNullValues.length) / values.length * 100).toFixed(2),
          uniqueCount: new Set(nonNullValues).size,
          uniquePercentage: (new Set(nonNullValues).size / nonNullValues.length * 100).toFixed(2),
          
          // Data type analysis
          types: analyzeTypes(nonNullValues),
          primaryType: detectPrimaryType(nonNullValues),
          
          // Value statistics
          statistics: calculateStatistics(nonNullValues),
          
          // Pattern detection
          patterns: detectPatterns(nonNullValues),
          
          // Quality metrics
          completeness: (nonNullValues.length / values.length * 100).toFixed(2),
          consistency: calculateConsistency(nonNullValues),
          validity: calculateValidity(nonNullValues, field)
        };
      });
      
      function analyzeTypes(values) {
        const types = {
          string: 0,
          number: 0,
          boolean: 0,
          date: 0,
          object: 0,
          array: 0
        };
        
        values.forEach(value => {
          if (typeof value === 'string') {
            if (isValidDate(value)) types.date++;
            else types.string++;
          } else if (typeof value === 'number') {
            types.number++;
          } else if (typeof value === 'boolean') {
            types.boolean++;
          } else if (Array.isArray(value)) {
            types.array++;
          } else if (typeof value === 'object') {
            types.object++;
          }
        });
        
        return types;
      }
      
      function detectPrimaryType(values) {
        if (values.length === 0) return 'unknown';
        
        const sample = values.slice(0, 100);
        if (sample.every(v => typeof v === 'number')) return 'numeric';
        if (sample.every(v => typeof v === 'boolean')) return 'boolean';
        if (sample.every(v => isValidDate(v))) return 'date';
        if (sample.every(v => typeof v === 'string')) return 'string';
        return 'mixed';
      }
      
      function calculateStatistics(values) {
        const numericValues = values
          .filter(v => typeof v === 'number')
          .sort((a, b) => a - b);
        
        if (numericValues.length === 0) return null;
        
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const mean = sum / numericValues.length;
        
        // Calculate standard deviation
        const squaredDifferences = numericValues.map(v => Math.pow(v - mean, 2));
        const variance = squaredDifferences.reduce((a, b) => a + b, 0) / numericValues.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate percentiles
        const percentile = (p) => {
          const index = Math.ceil((p / 100) * numericValues.length) - 1;
          return numericValues[index];
        };
        
        return {
          min: numericValues[0],
          max: numericValues[numericValues.length - 1],
          mean: mean.toFixed(2),
          median: percentile(50),
          stdDev: stdDev.toFixed(2),
          q1: percentile(25),
          q3: percentile(75),
          p95: percentile(95),
          p99: percentile(99)
        };
      }
      
      function detectPatterns(values) {
        const patterns = {
          email: 0,
          phone: 0,
          url: 0,
          ipAddress: 0,
          creditCard: 0,
          ssn: 0,
          uuid: 0
        };
        
        const regexPatterns = {
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          phone: /^\+?[\d\s\-\(\)]+$/,
          url: /^https?:\/\/.+/,
          ipAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
          creditCard: /^\d{13,19}$/,
          ssn: /^\d{3}-\d{2}-\d{4}$/,
          uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        };
        
        values.forEach(value => {
          const strValue = String(value);
          for (const [pattern, regex] of Object.entries(regexPatterns)) {
            if (regex.test(strValue)) {
              patterns[pattern]++;
            }
          }
        });
        
        return Object.entries(patterns)
          .filter(([_, count]) => count > 0)
          .reduce((acc, [pattern, count]) => ({
            ...acc,
            [pattern]: (count / values.length * 100).toFixed(2) + '%'
          }), {});
      }
      
      function calculateConsistency(values) {
        // Check format consistency
        const formats = values.map(v => {
          if (typeof v === 'string') return v.replace(/[a-zA-Z]/g, 'A').replace(/\d/g, '0');
          return typeof v;
        });
        
        const uniqueFormats = new Set(formats).size;
        return ((1 - (uniqueFormats - 1) / values.length) * 100).toFixed(2);
      }
      
      function calculateValidity(values, fieldName) {
        // Field-specific validation rules
        const validationRules = {
          email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
          age: v => typeof v === 'number' && v >= 0 && v <= 150,
          price: v => typeof v === 'number' && v >= 0,
          date: v => isValidDate(v)
        };
        
        const rule = validationRules[fieldName];
        if (!rule) return 100;
        
        const validCount = values.filter(rule).length;
        return (validCount / values.length * 100).toFixed(2);
      }
      
      function isValidDate(value) {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
      }
      
      // Detect anomalies
      fields.forEach(field => {
        const fieldProfile = profile.fields[field];
        
        // Check for anomalies
        if (fieldProfile.nullPercentage > 80) {
          profile.anomalies.push({
            field,
            type: 'high_null_rate',
            severity: 'warning',
            message: \`Field '\${field}' has \${fieldProfile.nullPercentage}% null values\`
          });
        }
        
        if (fieldProfile.uniquePercentage === '100.00' && fieldProfile.count > 10) {
          profile.anomalies.push({
            field,
            type: 'all_unique',
            severity: 'info',
            message: \`Field '\${field}' has all unique values - might be an ID field\`
          });
        }
        
        if (fieldProfile.consistency < 50) {
          profile.anomalies.push({
            field,
            type: 'inconsistent_format',
            severity: 'warning',
            message: \`Field '\${field}' has inconsistent formatting\`
          });
        }
      });
      
      return [{json: profile}];
    `
  },
  
  // Data cleanser
  dataCleaner: {
    type: "n8n-nodes-base.function",
    code: `
      // Comprehensive data cleansing
      const record = $json;
      const cleaningRules = {
        // Trim whitespace
        trimWhitespace: true,
        
        // Standardize case
        standardizeCase: {
          email: 'lower',
          name: 'title',
          country: 'upper'
        },
        
        // Remove special characters
        removeSpecialChars: ['phone', 'ssn'],
        
        // Standardize formats
        standardizeFormats: {
          phone: 'US',
          date: 'ISO',
          currency: 'USD'
        },
        
        // Handle nulls
        nullHandling: {
          replaceEmpty: true,
          defaultValues: {
            quantity: 0,
            price: 0,
            status: 'pending'
          }
        }
      };
      
      const cleaned = { ...record };
      
      // Apply cleaning rules
      for (const [field, value] of Object.entries(cleaned)) {
        if (value === null || value === undefined) {
          // Handle null values
          if (cleaningRules.nullHandling.defaultValues[field] !== undefined) {
            cleaned[field] = cleaningRules.nullHandling.defaultValues[field];
          }
          continue;
        }
        
        // Trim whitespace
        if (cleaningRules.trimWhitespace && typeof value === 'string') {
          cleaned[field] = value.trim();
        }
        
        // Standardize case
        if (cleaningRules.standardizeCase[field]) {
          const caseType = cleaningRules.standardizeCase[field];
          cleaned[field] = applyCase(cleaned[field], caseType);
        }
        
        // Remove special characters
        if (cleaningRules.removeSpecialChars.includes(field)) {
          cleaned[field] = String(cleaned[field]).replace(/[^a-zA-Z0-9]/g, '');
        }
        
        // Standardize formats
        if (cleaningRules.standardizeFormats[field]) {
          cleaned[field] = standardizeFormat(
            cleaned[field],
            field,
            cleaningRules.standardizeFormats[field]
          );
        }
        
        // Replace empty strings with null
        if (cleaningRules.nullHandling.replaceEmpty && cleaned[field] === '') {
          cleaned[field] = null;
        }
      }
      
      function applyCase(value, caseType) {
        const str = String(value);
        switch (caseType) {
          case 'lower':
            return str.toLowerCase();
          case 'upper':
            return str.toUpperCase();
          case 'title':
            return str.replace(/\w\S*/g, txt => 
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
          default:
            return str;
        }
      }
      
      function standardizeFormat(value, field, format) {
        switch (field) {
          case 'phone':
            return formatPhone(value, format);
          case 'date':
            return formatDate(value, format);
          case 'currency':
            return formatCurrency(value, format);
          default:
            return value;
        }
      }
      
      function formatPhone(phone, country) {
        const digits = String(phone).replace(/\D/g, '');
        if (country === 'US' && digits.length === 10) {
          return \`+1 (\${digits.slice(0, 3)}) \${digits.slice(3, 6)}-\${digits.slice(6)}\`;
        }
        return digits;
      }
      
      function formatDate(date, format) {
        const d = new Date(date);
        if (format === 'ISO') {
          return d.toISOString();
        }
        return d.toLocaleDateString();
      }
      
      function formatCurrency(amount, currency) {
        const num = parseFloat(amount);
        if (isNaN(num)) return amount;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(num);
      }
      
      // Add cleaning metadata
      cleaned._cleansing = {
        timestamp: new Date().toISOString(),
        rulesApplied: Object.keys(cleaningRules),
        originalHash: crypto.createHash('md5').update(JSON.stringify(record)).digest('hex'),
        cleanedHash: crypto.createHash('md5').update(JSON.stringify(cleaned)).digest('hex')
      };
      
      return [{json: cleaned}];
    `
  }
};
```

## Analytics and Reporting

### Example 5: Business Intelligence Pipeline

**Scenario**: Generate comprehensive analytics reports from raw data.

```javascript
// Business Intelligence Analytics
const analyticsP ipeline = {
  name: "BI Analytics Generator",
  
  // Metrics calculator
  metricsCalculator: {
    type: "n8n-nodes-base.function",
    code: `
      // Calculate business metrics
      const data = $items.map(item => item.json);
      
      const metrics = {
        revenue: calculateRevenue(data),
        customers: analyzeCustomers(data),
        products: analyzeProducts(data),
        trends: analyzeTrends(data),
        forecasts: generateForecasts(data),
        kpis: calculateKPIs(data)
      };
      
      function calculateRevenue(data) {
        const revenue = {
          total: 0,
          byMonth: {},
          byCategory: {},
          byRegion: {},
          growth: {}
        };
        
        data.forEach(row => {
          const amount = row.total_amount || 0;
          const month = new Date(row.date).toISOString().slice(0, 7);
          const category = row.category || 'uncategorized';
          const region = row.region || 'unknown';
          
          revenue.total += amount;
          revenue.byMonth[month] = (revenue.byMonth[month] || 0) + amount;
          revenue.byCategory[category] = (revenue.byCategory[category] || 0) + amount;
          revenue.byRegion[region] = (revenue.byRegion[region] || 0) + amount;
        });
        
        // Calculate growth rates
        const months = Object.keys(revenue.byMonth).sort();
        months.forEach((month, index) => {
          if (index > 0) {
            const prevMonth = months[index - 1];
            const growth = ((revenue.byMonth[month] - revenue.byMonth[prevMonth]) / 
                          revenue.byMonth[prevMonth] * 100).toFixed(2);
            revenue.growth[month] = growth + '%';
          }
        });
        
        return revenue;
      }
      
      function analyzeCustomers(data) {
        const customers = {};
        const analysis = {
          total: 0,
          new: 0,
          returning: 0,
          segments: {},
          lifetime_values: [],
          churn_rate: 0
        };
        
        data.forEach(row => {
          const customerId = row.customer_id;
          if (!customers[customerId]) {
            customers[customerId] = {
              firstOrder: row.date,
              lastOrder: row.date,
              orderCount: 0,
              totalSpent: 0,
              segment: row.customer_segment
            };
            analysis.new++;
          } else {
            analysis.returning++;
          }
          
          customers[customerId].orderCount++;
          customers[customerId].totalSpent += row.total_amount || 0;
          customers[customerId].lastOrder = row.date;
          
          // Segment analysis
          const segment = row.customer_segment || 'unknown';
          analysis.segments[segment] = (analysis.segments[segment] || 0) + 1;
        });
        
        analysis.total = Object.keys(customers).length;
        
        // Calculate LTV
        Object.values(customers).forEach(customer => {
          analysis.lifetime_values.push(customer.totalSpent);
        });
        
        // Calculate churn (simplified)
        const activeCustomers = Object.values(customers).filter(c => {
          const daysSinceLastOrder = (Date.now() - new Date(c.lastOrder)) / 86400000;
          return daysSinceLastOrder < 90; // Active if ordered in last 90 days
        }).length;
        
        analysis.churn_rate = ((analysis.total - activeCustomers) / analysis.total * 100).toFixed(2);
        
        return analysis;
      }
      
      function analyzeProducts(data) {
        const products = {};
        
        data.forEach(row => {
          const productId = row.product_id;
          if (!products[productId]) {
            products[productId] = {
              name: row.product_name,
              category: row.category,
              sold: 0,
              revenue: 0,
              avgPrice: 0
            };
          }
          
          products[productId].sold += row.quantity || 0;
          products[productId].revenue += row.total_amount || 0;
        });
        
        // Calculate averages and rankings
        const productList = Object.values(products);
        productList.forEach(product => {
          if (product.sold > 0) {
            product.avgPrice = (product.revenue / product.sold).toFixed(2);
          }
        });
        
        return {
          total: productList.length,
          topByRevenue: productList.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
          topByQuantity: productList.sort((a, b) => b.sold - a.sold).slice(0, 10),
          categories: groupBy(productList, 'category')
        };
      }
      
      function analyzeTrends(data) {
        // Time series analysis
        const timeSeries = {};
        
        data.forEach(row => {
          const date = new Date(row.date).toISOString().slice(0, 10);
          if (!timeSeries[date]) {
            timeSeries[date] = {
              orders: 0,
              revenue: 0,
              customers: new Set()
            };
          }
          
          timeSeries[date].orders++;
          timeSeries[date].revenue += row.total_amount || 0;
          timeSeries[date].customers.add(row.customer_id);
        });
        
        // Convert sets to counts
        Object.keys(timeSeries).forEach(date => {
          timeSeries[date].uniqueCustomers = timeSeries[date].customers.size;
          delete timeSeries[date].customers;
        });
        
        // Calculate moving averages
        const dates = Object.keys(timeSeries).sort();
        const movingAvg7Day = calculateMovingAverage(timeSeries, dates, 7);
        const movingAvg30Day = calculateMovingAverage(timeSeries, dates, 30);
        
        return {
          daily: timeSeries,
          movingAvg7Day,
          movingAvg30Day,
          seasonality: detectSeasonality(timeSeries)
        };
      }
      
      function generateForecasts(data) {
        // Simple linear regression forecast
        const timeSeries = [];
        const aggregated = {};
        
        data.forEach(row => {
          const month = new Date(row.date).toISOString().slice(0, 7);
          aggregated[month] = (aggregated[month] || 0) + (row.total_amount || 0);
        });
        
        Object.entries(aggregated).forEach(([month, revenue], index) => {
          timeSeries.push({ x: index, y: revenue });
        });
        
        // Calculate linear regression
        const n = timeSeries.length;
        const sumX = timeSeries.reduce((sum, point) => sum + point.x, 0);
        const sumY = timeSeries.reduce((sum, point) => sum + point.y, 0);
        const sumXY = timeSeries.reduce((sum, point) => sum + point.x * point.y, 0);
        const sumX2 = timeSeries.reduce((sum, point) => sum + point.x * point.x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Generate forecasts for next 3 months
        const forecasts = [];
        for (let i = 1; i <= 3; i++) {
          const x = n + i;
          const y = slope * x + intercept;
          forecasts.push({
            period: \`Month +\${i}\`,
            forecast: y.toFixed(2),
            confidence: 0.85 // Simplified confidence level
          });
        }
        
        return {
          method: 'linear_regression',
          historicalPeriods: n,
          forecasts,
          trend: slope > 0 ? 'increasing' : 'decreasing',
          trendStrength: Math.abs(slope).toFixed(2)
        };
      }
      
      function calculateKPIs(data) {
        const kpis = {
          avgOrderValue: 0,
          conversionRate: 0,
          customerAcquisitionCost: 0,
          revenuePerCustomer: 0,
          orderFrequency: 0
        };
        
        const totalRevenue = data.reduce((sum, row) => sum + (row.total_amount || 0), 0);
        const uniqueCustomers = new Set(data.map(row => row.customer_id)).size;
        const totalOrders = data.length;
        
        kpis.avgOrderValue = (totalRevenue / totalOrders).toFixed(2);
        kpis.revenuePerCustomer = (totalRevenue / uniqueCustomers).toFixed(2);
        kpis.orderFrequency = (totalOrders / uniqueCustomers).toFixed(2);
        
        // Mock CAC calculation (would need marketing spend data)
        kpis.customerAcquisitionCost = (totalRevenue * 0.15 / uniqueCustomers).toFixed(2);
        
        // Mock conversion rate (would need visitor data)
        kpis.conversionRate = (Math.random() * 5 + 2).toFixed(2) + '%';
        
        return kpis;
      }
      
      function calculateMovingAverage(data, dates, window) {
        const movingAvg = {};
        
        dates.forEach((date, index) => {
          if (index >= window - 1) {
            let sum = 0;
            for (let i = 0; i < window; i++) {
              sum += data[dates[index - i]].revenue;
            }
            movingAvg[date] = (sum / window).toFixed(2);
          }
        });
        
        return movingAvg;
      }
      
      function detectSeasonality(data) {
        // Simplified seasonality detection
        const monthlyTotals = {};
        
        Object.entries(data).forEach(([date, values]) => {
          const month = new Date(date).getMonth();
          monthlyTotals[month] = (monthlyTotals[month] || 0) + values.revenue;
        });
        
        const avgMonthly = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / 12;
        const seasonalIndex = {};
        
        Object.entries(monthlyTotals).forEach(([month, total]) => {
          seasonalIndex[month] = (total / avgMonthly).toFixed(2);
        });
        
        return seasonalIndex;
      }
      
      function groupBy(array, key) {
        return array.reduce((result, item) => {
          const group = item[key] || 'unknown';
          if (!result[group]) result[group] = [];
          result[group].push(item);
          return result;
        }, {});
      }
      
      return [{json: metrics}];
    `
  },
  
  // Report generator
  reportGenerator: {
    type: "n8n-nodes-base.function",
    code: `
      // Generate formatted reports
      const metrics = $json;
      
      const report = {
        executive_summary: generateExecutiveSummary(metrics),
        detailed_analysis: generateDetailedAnalysis(metrics),
        visualizations: prepareVisualizationData(metrics),
        recommendations: generateRecommendations(metrics),
        export_formats: {
          pdf: generatePDFReport(metrics),
          excel: generateExcelReport(metrics),
          powerbi: generatePowerBIData(metrics)
        }
      };
      
      function generateExecutiveSummary(metrics) {
        return {
          title: "Executive Dashboard",
          period: \`\${new Date().toISOString().slice(0, 7)} Report\`,
          highlights: [
            {
              metric: "Total Revenue",
              value: \`$\${metrics.revenue.total.toLocaleString()}\`,
              change: metrics.revenue.growth[Object.keys(metrics.revenue.growth).pop()] || "N/A"
            },
            {
              metric: "Customer Base",
              value: metrics.customers.total.toLocaleString(),
              change: \`\${metrics.customers.new} new customers\`
            },
            {
              metric: "Average Order Value",
              value: \`$\${metrics.kpis.avgOrderValue}\`,
              change: "vs last period"
            },
            {
              metric: "Churn Rate",
              value: \`\${metrics.customers.churn_rate}%\`,
              status: parseFloat(metrics.customers.churn_rate) > 10 ? "warning" : "good"
            }
          ],
          key_insights: [
            "Revenue trend is " + (metrics.forecasts.trend === 'increasing' ? 'positive' : 'negative'),
            \`Top performing category: \${Object.keys(metrics.revenue.byCategory)[0]}\`,
            \`Customer acquisition cost: $\${metrics.kpis.customerAcquisitionCost}\`
          ]
        };
      }
      
      function generateDetailedAnalysis(metrics) {
        return {
          revenue_analysis: {
            breakdown: metrics.revenue,
            insights: analyzeRevenuePatterns(metrics.revenue)
          },
          customer_analysis: {
            segmentation: metrics.customers.segments,
            behavior: analyzeCustomerBehavior(metrics.customers)
          },
          product_performance: {
            top_products: metrics.products.topByRevenue,
            category_analysis: metrics.products.categories
          },
          trend_analysis: {
            time_series: metrics.trends,
            forecasts: metrics.forecasts
          }
        };
      }
      
      function prepareVisualizationData(metrics) {
        return {
          charts: [
            {
              type: 'line',
              title: 'Revenue Trend',
              data: Object.entries(metrics.revenue.byMonth).map(([month, revenue]) => ({
                x: month,
                y: revenue
              }))
            },
            {
              type: 'pie',
              title: 'Revenue by Category',
              data: Object.entries(metrics.revenue.byCategory).map(([category, revenue]) => ({
                label: category,
                value: revenue
              }))
            },
            {
              type: 'bar',
              title: 'Top Products',
              data: metrics.products.topByRevenue.slice(0, 10).map(product => ({
                label: product.name,
                value: product.revenue
              }))
            },
            {
              type: 'heatmap',
              title: 'Seasonality Pattern',
              data: metrics.trends.seasonality
            }
          ],
          tables: [
            {
              title: 'KPI Summary',
              headers: ['Metric', 'Value', 'Target', 'Status'],
              rows: Object.entries(metrics.kpis).map(([key, value]) => [
                key,
                value,
                'TBD',
                'On Track'
              ])
            }
          ]
        };
      }
      
      function generateRecommendations(metrics) {
        const recommendations = [];
        
        // Revenue-based recommendations
        if (metrics.forecasts.trend === 'decreasing') {
          recommendations.push({
            priority: 'high',
            category: 'revenue',
            action: 'Implement revenue recovery strategies',
            details: 'Consider promotional campaigns or pricing adjustments'
          });
        }
        
        // Customer-based recommendations
        if (parseFloat(metrics.customers.churn_rate) > 10) {
          recommendations.push({
            priority: 'high',
            category: 'retention',
            action: 'Reduce customer churn',
            details: 'Implement retention programs and improve customer experience'
          });
        }
        
        // Product-based recommendations
        const lowPerformers = metrics.products.topByRevenue.slice(-5);
        if (lowPerformers.length > 0) {
          recommendations.push({
            priority: 'medium',
            category: 'inventory',
            action: 'Review underperforming products',
            details: \`Consider discontinuing or repricing \${lowPerformers.length} products\`
          });
        }
        
        return recommendations;
      }
      
      function analyzeRevenuePatterns(revenue) {
        const insights = [];
        
        // Growth analysis
        const growthRates = Object.values(revenue.growth).map(g => parseFloat(g));
        const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
        insights.push(\`Average monthly growth: \${avgGrowth.toFixed(2)}%\`);
        
        // Category concentration
        const topCategory = Object.entries(revenue.byCategory)
          .sort((a, b) => b[1] - a[1])[0];
        const categoryConcentration = (topCategory[1] / revenue.total * 100).toFixed(2);
        insights.push(\`Top category represents \${categoryConcentration}% of revenue\`);
        
        return insights;
      }
      
      function analyzeCustomerBehavior(customers) {
        return {
          new_vs_returning: {
            new: customers.new,
            returning: customers.returning,
            ratio: (customers.returning / customers.new).toFixed(2)
          },
          segment_distribution: customers.segments,
          avg_lifetime_value: (
            customers.lifetime_values.reduce((a, b) => a + b, 0) / 
            customers.lifetime_values.length
          ).toFixed(2)
        };
      }
      
      function generatePDFReport(metrics) {
        // Return data formatted for PDF generation
        return {
          format: 'pdf',
          template: 'business_report',
          data: metrics
        };
      }
      
      function generateExcelReport(metrics) {
        // Return data formatted for Excel export
        return {
          format: 'xlsx',
          sheets: [
            { name: 'Summary', data: metrics.kpis },
            { name: 'Revenue', data: metrics.revenue },
            { name: 'Customers', data: metrics.customers },
            { name: 'Products', data: metrics.products }
          ]
        };
      }
      
      function generatePowerBIData(metrics) {
        // Return data formatted for Power BI
        return {
          format: 'powerbi',
          datasets: [
            { name: 'Metrics', data: flattenObject(metrics) }
          ]
        };
      }
      
      function flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const [key, value] of Object.entries(obj)) {
          const newKey = prefix ? \`\${prefix}_\${key}\` : key;
          if (typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(flattened, flattenObject(value, newKey));
          } else {
            flattened[newKey] = value;
          }
        }
        return flattened;
      }
      
      return [{json: report}];
    `
  }
};
```

## Performance Optimization

### Batch Processing Strategies
```javascript
// Optimize large-scale data processing
const batchOptimization = {
  chunking: `
    const chunkSize = 1000;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await processChunk(chunk);
    }
  `,
  
  parallelProcessing: `
    const workers = 4;
    const chunks = splitIntoChunks(items, workers);
    await Promise.all(chunks.map(processChunk));
  `,
  
  streaming: `
    const stream = createReadStream(file);
    stream.on('data', chunk => processChunk(chunk));
  `
};
```

## Best Practices

1. **Data Quality First**: Always validate and clean data before processing
2. **Incremental Processing**: Process only new/changed data when possible
3. **Error Recovery**: Implement checkpoints and rollback mechanisms
4. **Monitoring**: Track processing metrics and data lineage
5. **Documentation**: Document transformation logic and business rules

## Conclusion

n8n transforms complex data processing into manageable, visual workflows. By leveraging its extensive integration capabilities and flexible transformation tools, organizations can build robust data pipelines that scale with their needs. The key to success lies in understanding your data, implementing proper quality controls, and optimizing for performance while maintaining reliability.