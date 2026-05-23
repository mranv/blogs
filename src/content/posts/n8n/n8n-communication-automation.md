---
slug: 'n8n-communication-automation'

title: "n8n Communication Automation: Email, Slack, SMS, and Messaging Workflows"
published: 2025-01-20
description: "Build powerful communication workflows in n8n for email automation, Slack integration, SMS campaigns, and multi-channel messaging with real-world examples"
image: ""
tags: ["n8n", "communication", "email", "slack", "SMS", "automation", "messaging"]
category: Communication
draft: false

---

## Introduction: Mastering Communication Automation

Communication is the lifeblood of modern business operations. n8n transforms how organizations handle communication across multiple channels, from automated email campaigns to real-time Slack notifications and SMS alerts. This comprehensive guide explores advanced communication automation patterns that streamline interactions with customers, teams, and stakeholders.

## Multi-Channel Communication Architecture

### Core Communication Capabilities

1. **Email Services**: Gmail, Outlook, SendGrid, Mailgun
2. **Messaging Platforms**: Slack, Microsoft Teams, Discord
3. **SMS/Voice**: Twilio, Vonage, MessageBird
4. **Social Messaging**: WhatsApp, Telegram, Facebook Messenger
5. **Push Notifications**: OneSignal, Firebase, Pushover
6. **Webhooks**: Custom integrations for any platform

## Email Automation Workflows

### Example 1: Intelligent Email Campaign Management

**Scenario**: Create a sophisticated email campaign system with personalization, A/B testing, and analytics.

```json
{
  "name": "Advanced Email Campaign Orchestrator",
  "nodes": [
    {
      "name": "Campaign Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 9 * * 1-5",
        "timezone": "America/New_York"
      }
    },
    {
      "name": "Fetch Campaign Data",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": `
          SELECT 
            c.id as campaign_id,
            c.name as campaign_name,
            c.subject_line,
            c.template_id,
            c.segment_id,
            c.ab_test_enabled,
            c.personalization_rules,
            s.criteria as segment_criteria
          FROM campaigns c
          JOIN segments s ON c.segment_id = s.id
          WHERE c.status = 'scheduled'
            AND c.send_date <= CURRENT_DATE
            AND c.sent = false
        `
      }
    },
    {
      "name": "Get Recipients",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Dynamic recipient segmentation
          const campaign = $json;
          const segmentCriteria = JSON.parse(campaign.segment_criteria);
          
          // Build dynamic query based on segment criteria
          let query = 'SELECT * FROM contacts WHERE ';
          const conditions = [];
          
          if (segmentCriteria.tags) {
            conditions.push(\`tags && ARRAY[\${segmentCriteria.tags.map(t => \`'\${t}'\`).join(',')}]\`);
          }
          
          if (segmentCriteria.location) {
            conditions.push(\`location = '\${segmentCriteria.location}'\`);
          }
          
          if (segmentCriteria.engagement_score) {
            conditions.push(\`engagement_score >= \${segmentCriteria.engagement_score}\`);
          }
          
          if (segmentCriteria.last_activity) {
            conditions.push(\`last_activity >= NOW() - INTERVAL '\${segmentCriteria.last_activity} days'\`);
          }
          
          query += conditions.join(' AND ');
          query += ' AND email_opt_in = true AND bounce_count < 3';
          
          // Execute query to get recipients
          const recipients = await $db.query(query);
          
          // Apply A/B testing split if enabled
          if (campaign.ab_test_enabled) {
            const halfIndex = Math.floor(recipients.length / 2);
            return {
              groupA: recipients.slice(0, halfIndex),
              groupB: recipients.slice(halfIndex),
              campaign: campaign
            };
          }
          
          return {
            recipients: recipients,
            campaign: campaign
          };
        `
      }
    },
    {
      "name": "Personalize Content",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Advanced email personalization
          const data = $json;
          const personalizedEmails = [];
          
          const recipients = data.groupA || data.recipients;
          const campaign = data.campaign;
          const personalizationRules = JSON.parse(campaign.personalization_rules || '{}');
          
          for (const recipient of recipients) {
            // Fetch additional personalization data
            const userData = await enrichUserData(recipient);
            
            // Apply personalization rules
            let subject = campaign.subject_line;
            let content = await getEmailTemplate(campaign.template_id);
            
            // Basic personalization
            subject = subject.replace('{{first_name}}', userData.first_name || 'there');
            subject = subject.replace('{{company}}', userData.company || 'your company');
            
            content = content.replace(/{{first_name}}/g, userData.first_name || 'there');
            content = content.replace(/{{last_name}}/g, userData.last_name || '');
            content = content.replace(/{{company}}/g, userData.company || '');
            
            // Dynamic content blocks
            if (personalizationRules.dynamic_content) {
              content = applyDynamicContent(content, userData, personalizationRules);
            }
            
            // Product recommendations
            if (personalizationRules.include_recommendations) {
              const recommendations = await getProductRecommendations(userData);
              content = content.replace('{{recommendations}}', formatRecommendations(recommendations));
            }
            
            // Behavioral triggers
            if (personalizationRules.behavioral_content) {
              content = applyBehavioralContent(content, userData);
            }
            
            // A/B test variations
            if (campaign.ab_test_enabled && data.groupB && recipients === data.groupB) {
              subject = applyABVariation(subject, 'B');
              content = applyABVariation(content, 'B');
            }
            
            personalizedEmails.push({
              to: recipient.email,
              subject: subject,
              html: content,
              campaign_id: campaign.campaign_id,
              recipient_id: recipient.id,
              personalization_applied: true,
              test_group: data.groupB && recipients === data.groupB ? 'B' : 'A',
              tracking_pixel: generateTrackingPixel(campaign.campaign_id, recipient.id),
              unsubscribe_link: generateUnsubscribeLink(recipient.id, recipient.email)
            });
          }
          
          async function enrichUserData(recipient) {
            // Fetch additional data from CRM, analytics, etc.
            const [crmData, analyticsData, purchaseHistory] = await Promise.all([
              $http.get(\`https://crm.api/contacts/\${recipient.id}\`),
              $http.get(\`https://analytics.api/users/\${recipient.id}\`),
              $db.query('SELECT * FROM purchases WHERE customer_id = ?', [recipient.id])
            ]);
            
            return {
              ...recipient,
              ...crmData.data,
              behavior: analyticsData.data,
              purchases: purchaseHistory
            };
          }
          
          async function getEmailTemplate(templateId) {
            const template = await $db.query('SELECT content FROM email_templates WHERE id = ?', [templateId]);
            return template[0].content;
          }
          
          function applyDynamicContent(content, userData, rules) {
            // Apply conditional content based on user attributes
            if (userData.customer_type === 'premium') {
              content = content.replace('{{premium_content}}', getPremiumContent());
            } else {
              content = content.replace('{{premium_content}}', '');
            }
            
            if (userData.location) {
              content = content.replace('{{local_events}}', getLocalEvents(userData.location));
            }
            
            return content;
          }
          
          async function getProductRecommendations(userData) {
            // ML-based product recommendations
            const response = await $http.post('https://ml.api/recommendations', {
              user_id: userData.id,
              purchase_history: userData.purchases,
              browsing_behavior: userData.behavior,
              limit: 4
            });
            
            return response.data.recommendations;
          }
          
          function formatRecommendations(recommendations) {
            return recommendations.map(product => \`
              <div style="display: inline-block; width: 200px; margin: 10px;">
                <img src="\${product.image}" style="width: 100%;">
                <h3>\${product.name}</h3>
                <p>\${product.price}</p>
                <a href="\${product.url}">View Product</a>
              </div>
            \`).join('');
          }
          
          function applyBehavioralContent(content, userData) {
            // Add content based on user behavior
            if (userData.behavior.abandoned_cart) {
              content = content.replace('{{cart_reminder}}', getCartReminderContent(userData.behavior.cart_items));
            }
            
            if (userData.behavior.browsed_category) {
              content = content.replace('{{category_highlight}}', getCategoryContent(userData.behavior.browsed_category));
            }
            
            return content;
          }
          
          function applyABVariation(content, group) {
            // Apply A/B test variations
            if (group === 'B') {
              content = content.replace('{{cta_button}}', 'Shop Now - Limited Time!');
              content = content.replace('{{header_image}}', 'header-b.jpg');
            } else {
              content = content.replace('{{cta_button}}', 'Explore Collection');
              content = content.replace('{{header_image}}', 'header-a.jpg');
            }
            return content;
          }
          
          function generateTrackingPixel(campaignId, recipientId) {
            const trackingId = Buffer.from(\`\${campaignId}:\${recipientId}\`).toString('base64');
            return \`<img src="https://tracking.api/pixel/\${trackingId}" width="1" height="1" style="display:none;">\`;
          }
          
          function generateUnsubscribeLink(recipientId, email) {
            const token = crypto.createHash('sha256').update(\`\${recipientId}:\${email}:\${process.env.SECRET_KEY}\`).digest('hex');
            return \`https://unsubscribe.example.com?id=\${recipientId}&token=\${token}\`;
          }
          
          return personalizedEmails.map(email => ({json: email}));
        `
      }
    },
    {
      "name": "Send Emails",
      "type": "n8n-nodes-base.sendGrid",
      "parameters": {
        "fromEmail": "{{$credentials.senderEmail}}",
        "toEmail": "={{$json.to}}",
        "subject": "={{$json.subject}}",
        "html": "={{$json.html}}",
        "options": {
          "trackingSettings": {
            "clickTracking": true,
            "openTracking": true,
            "subscriptionTracking": false
          },
          "headers": {
            "X-Campaign-ID": "={{$json.campaign_id}}",
            "X-Recipient-ID": "={{$json.recipient_id}}",
            "X-Test-Group": "={{$json.test_group}}"
          },
          "categories": ["marketing", "campaign"],
          "batchSize": 100,
          "sendAt": "={{$now.plus(5, 'minutes').toUnixInteger()}}"
        }
      }
    },
    {
      "name": "Track Send Status",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "email_send_log",
        "columns": [
          "campaign_id",
          "recipient_id",
          "email",
          "subject",
          "status",
          "test_group",
          "sent_at",
          "message_id"
        ],
        "values": "={{$json}}"
      }
    }
  ]
}
```

### Example 2: Automated Customer Support Email System

**Scenario**: Intelligent email support system with auto-responses, ticket creation, and escalation.

```javascript
// Customer Support Email Automation
const supportEmailSystem = {
  name: "Intelligent Support Email Handler",
  
  // Email receiver
  emailReceiver: {
    type: "n8n-nodes-base.emailReadImap",
    parameters: {
      mailbox: "INBOX",
      postProcessAction: "move",
      moveToMailbox: "Processed",
      options: {
        customEmailConfig: {
          host: "imap.gmail.com",
          port: 993,
          secure: true
        }
      }
    }
  },
  
  // Email classifier
  emailClassifier: {
    type: "n8n-nodes-base.function",
    code: `
      // AI-powered email classification
      const email = $json;
      
      // Extract email metadata
      const emailData = {
        from: email.from.value[0].address,
        subject: email.subject,
        body: email.text || email.html,
        attachments: email.attachments || [],
        received: email.date,
        messageId: email.messageId
      };
      
      // Classify email intent
      const classification = await classifyEmail(emailData);
      
      // Check for existing customer
      const customer = await findOrCreateCustomer(emailData.from);
      
      // Determine priority
      const priority = calculatePriority(classification, customer, emailData);
      
      // Check for spam/abuse
      const spamScore = await checkSpam(emailData);
      
      async function classifyEmail(email) {
        // Use NLP to classify email intent
        const response = await $http.post('https://nlp.api/classify', {
          text: email.subject + ' ' + email.body,
          model: 'support-classifier'
        });
        
        const intents = response.data.intents;
        const sentiment = response.data.sentiment;
        const entities = response.data.entities;
        
        // Determine primary category
        const categories = {
          'technical_issue': ['bug', 'error', 'not working', 'crash', 'broken'],
          'billing': ['payment', 'invoice', 'charge', 'refund', 'subscription'],
          'feature_request': ['request', 'feature', 'suggestion', 'add', 'implement'],
          'account': ['password', 'login', 'account', 'access', 'reset'],
          'general': []
        };
        
        let category = 'general';
        let maxScore = 0;
        
        for (const [cat, keywords] of Object.entries(categories)) {
          const score = keywords.filter(keyword => 
            email.body.toLowerCase().includes(keyword)
          ).length;
          
          if (score > maxScore) {
            maxScore = score;
            category = cat;
          }
        }
        
        return {
          category: category,
          sentiment: sentiment,
          confidence: intents[0]?.confidence || 0,
          entities: entities,
          keywords: extractKeywords(email.body)
        };
      }
      
      async function findOrCreateCustomer(email) {
        let customer = await $db.query(
          'SELECT * FROM customers WHERE email = ?',
          [email]
        );
        
        if (customer.length === 0) {
          // Create new customer
          const newCustomer = {
            email: email,
            created_at: new Date(),
            support_tier: 'standard',
            total_tickets: 0
          };
          
          await $db.query(
            'INSERT INTO customers (email, created_at, support_tier, total_tickets) VALUES (?, ?, ?, ?)',
            [newCustomer.email, newCustomer.created_at, newCustomer.support_tier, newCustomer.total_tickets]
          );
          
          customer = [newCustomer];
        }
        
        return customer[0];
      }
      
      function calculatePriority(classification, customer, email) {
        let priority = 'normal';
        
        // High priority conditions
        const highPriorityConditions = [
          classification.sentiment.score < -0.5, // Very negative sentiment
          customer.support_tier === 'enterprise',
          email.subject.toLowerCase().includes('urgent'),
          email.subject.toLowerCase().includes('critical'),
          classification.category === 'technical_issue' && classification.confidence > 0.8
        ];
        
        if (highPriorityConditions.filter(Boolean).length >= 2) {
          priority = 'high';
        } else if (customer.support_tier === 'premium') {
          priority = 'medium';
        }
        
        return priority;
      }
      
      async function checkSpam(email) {
        // Spam detection logic
        const spamIndicators = [
          email.from.includes('noreply'),
          email.body.match(/viagra|casino|lottery/gi),
          email.body.split(' ').length < 5,
          !email.subject || email.subject.length < 3
        ];
        
        const spamScore = spamIndicators.filter(Boolean).length * 25;
        
        // Check against spam database
        const knownSpammer = await $db.query(
          'SELECT * FROM spam_emails WHERE email = ?',
          [email.from]
        );
        
        if (knownSpammer.length > 0) {
          return 100;
        }
        
        return spamScore;
      }
      
      function extractKeywords(text) {
        // Simple keyword extraction
        const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an'];
        const words = text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3 && !stopWords.includes(word));
        
        const frequency = {};
        words.forEach(word => {
          frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word]) => word);
      }
      
      return [{
        json: {
          email: emailData,
          customer: customer,
          classification: classification,
          priority: priority,
          spamScore: spamScore,
          shouldProcess: spamScore < 50
        }
      }];
    `
  },
  
  // Auto-responder
  autoResponder: {
    type: "n8n-nodes-base.function",
    code: `
      // Generate intelligent auto-responses
      const data = $json;
      
      if (!data.shouldProcess) {
        return []; // Skip spam
      }
      
      // Check if auto-response should be sent
      const shouldAutoRespond = await checkAutoResponseEligibility(data);
      
      if (!shouldAutoRespond) {
        return [{json: {...data, autoResponse: false}}];
      }
      
      // Generate contextual auto-response
      const response = await generateAutoResponse(data);
      
      async function checkAutoResponseEligibility(data) {
        // Check if we've already responded recently
        const recentResponses = await $db.query(
          'SELECT * FROM auto_responses WHERE customer_email = ? AND created_at > NOW() - INTERVAL 1 HOUR',
          [data.customer.email]
        );
        
        if (recentResponses.length > 0) {
          return false;
        }
        
        // Check business hours
        const now = new Date();
        const hour = now.getHours();
        const isBusinessHours = hour >= 9 && hour < 17;
        
        // Auto-respond outside business hours or for certain categories
        return !isBusinessHours || 
               data.classification.category === 'account' ||
               data.classification.category === 'general';
      }
      
      async function generateAutoResponse(data) {
        const templates = {
          technical_issue: \`
            Thank you for contacting support. We've received your technical issue report and our team is investigating.
            
            Ticket #: {{ticket_id}}
            Priority: {{priority}}
            Expected Response Time: {{response_time}}
            
            In the meantime, you might find these resources helpful:
            - Knowledge Base: https://help.example.com
            - Status Page: https://status.example.com
            
            We'll update you as soon as we have more information.
          \`,
          
          billing: \`
            Thank you for your billing inquiry. Our billing team will review your request and respond within 24 hours.
            
            Ticket #: {{ticket_id}}
            
            For immediate assistance with common billing issues:
            - Update payment method: https://account.example.com/billing
            - View invoices: https://account.example.com/invoices
            - Manage subscription: https://account.example.com/subscription
          \`,
          
          feature_request: \`
            Thank you for your feature suggestion! We love hearing from our users.
            
            Your request has been logged and will be reviewed by our product team.
            
            Ticket #: {{ticket_id}}
            
            You can track the status of feature requests at:
            https://feedback.example.com
          \`,
          
          account: \`
            Thank you for contacting us about your account.
            
            Ticket #: {{ticket_id}}
            
            For security reasons, account-related issues require verification. 
            Please use the following secure link to verify your identity:
            {{verification_link}}
            
            Common account solutions:
            - Reset password: https://account.example.com/reset
            - Update profile: https://account.example.com/profile
            - Security settings: https://account.example.com/security
          \`,
          
          general: \`
            Thank you for contacting support. We've received your message and will respond shortly.
            
            Ticket #: {{ticket_id}}
            Expected Response Time: {{response_time}}
            
            Visit our Help Center for immediate assistance:
            https://help.example.com
          \`
        };
        
        // Generate ticket ID
        const ticketId = 'TKT-' + Date.now().toString(36).toUpperCase();
        
        // Calculate response time based on priority
        const responseTimes = {
          high: '2 hours',
          medium: '4 hours',
          normal: '24 hours'
        };
        
        // Get appropriate template
        let template = templates[data.classification.category] || templates.general;
        
        // Replace variables
        template = template.replace('{{ticket_id}}', ticketId);
        template = template.replace('{{priority}}', data.priority);
        template = template.replace('{{response_time}}', responseTimes[data.priority]);
        
        if (data.classification.category === 'account') {
          const verificationToken = crypto.randomBytes(32).toString('hex');
          const verificationLink = \`https://verify.example.com?token=\${verificationToken}&email=\${data.customer.email}\`;
          template = template.replace('{{verification_link}}', verificationLink);
          
          // Store verification token
          await $db.query(
            'INSERT INTO verification_tokens (token, email, created_at) VALUES (?, ?, ?)',
            [verificationToken, data.customer.email, new Date()]
          );
        }
        
        // Add personalization
        if (data.customer.name) {
          template = \`Hi \${data.customer.name},\n\n\` + template;
        } else {
          template = \`Hi there,\n\n\` + template;
        }
        
        template += \`\n\nBest regards,\nSupport Team\`;
        
        return {
          to: data.customer.email,
          subject: \`Re: \${data.email.subject} [Ticket #\${ticketId}]\`,
          body: template,
          ticketId: ticketId,
          category: data.classification.category,
          priority: data.priority
        };
      }
      
      const autoResponse = await generateAutoResponse(data);
      
      return [{
        json: {
          ...data,
          autoResponse: autoResponse,
          shouldSendResponse: true
        }
      }];
    `
  }
};
```

## Slack Integration Workflows

### Example 3: Advanced Slack Bot Automation

**Scenario**: Create an intelligent Slack bot for team collaboration, alerts, and workflow automation.

```javascript
// Slack Bot Automation System
const slackBotSystem = {
  name: "Intelligent Slack Bot",
  
  // Slack event listener
  slackEventListener: {
    type: "n8n-nodes-base.webhook",
    parameters: {
      path: "slack/events",
      responseMode: "onReceived",
      httpMethod: "POST"
    }
  },
  
  // Event processor
  eventProcessor: {
    type: "n8n-nodes-base.function",
    code: `
      // Process Slack events
      const event = $json;
      
      // Verify Slack request
      if (event.type === 'url_verification') {
        return [{json: {challenge: event.challenge}}];
      }
      
      // Process different event types
      const eventHandlers = {
        'message': handleMessage,
        'app_mention': handleMention,
        'reaction_added': handleReaction,
        'slash_command': handleSlashCommand,
        'interactive_message': handleInteraction
      };
      
      const handler = eventHandlers[event.event?.type || event.type];
      if (!handler) {
        return [{json: {error: 'Unknown event type'}}];
      }
      
      const response = await handler(event);
      
      async function handleMessage(event) {
        const message = event.event;
        
        // Skip bot messages
        if (message.bot_id) {
          return null;
        }
        
        // Analyze message intent
        const intent = await analyzeIntent(message.text);
        
        // Handle different intents
        switch (intent.type) {
          case 'question':
            return await handleQuestion(message, intent);
          
          case 'task':
            return await createTask(message, intent);
          
          case 'alert':
            return await handleAlert(message, intent);
          
          case 'report':
            return await generateReport(message, intent);
          
          default:
            return null;
        }
      }
      
      async function handleMention(event) {
        const mention = event.event;
        const text = mention.text.replace(/<@[A-Z0-9]+>/g, '').trim();
        
        // Parse command from mention
        const commands = {
          'status': getSystemStatus,
          'deploy': triggerDeployment,
          'report': generateReport,
          'help': showHelp,
          'remind': setReminder,
          'poll': createPoll,
          'standup': startStandup
        };
        
        const [command, ...args] = text.split(' ');
        const handler = commands[command.toLowerCase()];
        
        if (handler) {
          return await handler(mention, args);
        }
        
        // AI-powered response for unrecognized commands
        return await generateAIResponse(mention, text);
      }
      
      async function handleSlashCommand(event) {
        const command = event.command;
        const text = event.text;
        const userId = event.user_id;
        const channelId = event.channel_id;
        
        // Command handlers
        const handlers = {
          '/task': async () => {
            const task = parseTaskFromText(text);
            await createJiraTicket(task);
            return {
              response_type: 'in_channel',
              text: \`Task created: \${task.title}\`,
              attachments: [{
                color: 'good',
                fields: [
                  { title: 'Assignee', value: task.assignee, short: true },
                  { title: 'Priority', value: task.priority, short: true },
                  { title: 'Due Date', value: task.dueDate, short: true }
                ]
              }]
            };
          },
          
          '/oncall': async () => {
            const oncallInfo = await getOncallSchedule();
            return {
              response_type: 'ephemeral',
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '*Current On-Call Schedule*'
                  }
                },
                {
                  type: 'section',
                  fields: oncallInfo.map(shift => ({
                    type: 'mrkdwn',
                    text: \`*\${shift.role}*\n<@\${shift.userId}>\nUntil: \${shift.endTime}\`
                  }))
                }
              ]
            };
          },
          
          '/metrics': async () => {
            const metrics = await fetchMetrics(text || 'daily');
            return {
              response_type: 'in_channel',
              blocks: formatMetricsBlocks(metrics)
            };
          },
          
          '/incident': async () => {
            return await createIncident(text, userId, channelId);
          }
        };
        
        const handler = handlers[command];
        if (handler) {
          return await handler();
        }
      }
      
      async function analyzeIntent(text) {
        // Use NLP to understand message intent
        const patterns = {
          question: /^(what|when|where|who|why|how|is|are|can|could|would)/i,
          task: /(todo|task|assign|create|ticket)/i,
          alert: /(alert|urgent|critical|down|broken|error)/i,
          report: /(report|summary|stats|metrics|analytics)/i
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
          if (pattern.test(text)) {
            return {
              type: type,
              confidence: 0.8,
              entities: extractEntities(text)
            };
          }
        }
        
        return { type: 'general', confidence: 0.5 };
      }
      
      async function createTask(message, intent) {
        // Extract task details from message
        const task = {
          title: message.text,
          creator: message.user,
          channel: message.channel,
          timestamp: message.ts,
          priority: detectPriority(message.text),
          assignee: extractMentions(message.text)[0] || null,
          dueDate: extractDate(message.text)
        };
        
        // Create task in project management system
        const jiraResponse = await $http.post('https://jira.api/rest/api/2/issue', {
          fields: {
            project: { key: 'PROJ' },
            summary: task.title,
            description: \`Created from Slack by <@\${task.creator}> in #\${task.channel}\`,
            issuetype: { name: 'Task' },
            priority: { name: task.priority },
            assignee: { name: await getUserEmail(task.assignee) },
            duedate: task.dueDate
          }
        });
        
        // Send confirmation to Slack
        return {
          channel: message.channel,
          thread_ts: message.ts,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: \`✅ Task created: *\${jiraResponse.data.key}*\`
              }
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View in Jira' },
                  url: \`https://jira.example.com/browse/\${jiraResponse.data.key}\`
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Edit' },
                  action_id: 'edit_task',
                  value: jiraResponse.data.key
                }
              ]
            }
          ]
        };
      }
      
      async function generateAIResponse(mention, text) {
        // Use AI to generate contextual response
        const context = await gatherContext(mention);
        
        const response = await $http.post('https://ai.api/chat', {
          messages: [
            {
              role: 'system',
              content: 'You are a helpful Slack bot assistant for a development team.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          context: context
        });
        
        return {
          channel: mention.channel,
          thread_ts: mention.ts,
          text: response.data.content,
          mrkdwn: true
        };
      }
      
      async function createIncident(description, userId, channelId) {
        // Create incident management workflow
        const incidentId = 'INC-' + Date.now().toString(36).toUpperCase();
        const incidentChannel = await createIncidentChannel(incidentId);
        
        // Set up incident structure
        const incident = {
          id: incidentId,
          description: description,
          reporter: userId,
          channel: incidentChannel.id,
          severity: detectSeverity(description),
          status: 'investigating',
          created: new Date().toISOString()
        };
        
        // Store incident
        await $db.query(
          'INSERT INTO incidents (id, description, reporter, channel, severity, status, created) VALUES (?, ?, ?, ?, ?, ?, ?)',
          Object.values(incident)
        );
        
        // Notify relevant teams
        await notifyOncall(incident);
        
        // Create incident channel and invite participants
        await inviteToChannel(incidentChannel.id, [userId, ...getIncidentResponders(incident.severity)]);
        
        // Post initial message in incident channel
        await postToChannel(incidentChannel.id, {
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: \`Incident \${incidentId}: \${description}\`
              }
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: \`*Severity:* \${incident.severity}\` },
                { type: 'mrkdwn', text: \`*Status:* \${incident.status}\` },
                { type: 'mrkdwn', text: \`*Reporter:* <@\${userId}>\` },
                { type: 'mrkdwn', text: \`*Created:* \${incident.created}\` }
              ]
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Acknowledge' },
                  style: 'primary',
                  action_id: 'acknowledge_incident',
                  value: incidentId
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Escalate' },
                  style: 'danger',
                  action_id: 'escalate_incident',
                  value: incidentId
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Update Status' },
                  action_id: 'update_incident',
                  value: incidentId
                }
              ]
            }
          ]
        });
        
        return {
          response_type: 'in_channel',
          text: \`Incident \${incidentId} created. Join <#\${incidentChannel.id}> for updates.\`,
          attachments: [{
            color: incident.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Incident ID', value: incidentId, short: true },
              { title: 'Severity', value: incident.severity, short: true }
            ]
          }]
        };
      }
      
      function extractEntities(text) {
        // Extract mentions, dates, priorities, etc.
        return {
          mentions: extractMentions(text),
          dates: extractDate(text),
          priorities: detectPriority(text),
          channels: text.match(/<#[A-Z0-9]+>/g) || []
        };
      }
      
      function extractMentions(text) {
        const mentions = text.match(/<@[A-Z0-9]+>/g) || [];
        return mentions.map(m => m.replace(/<@|>/g, ''));
      }
      
      function extractDate(text) {
        // Simple date extraction
        const patterns = [
          /tomorrow/i,
          /next (monday|tuesday|wednesday|thursday|friday)/i,
          /\d{1,2}\/\d{1,2}\/\d{4}/,
          /\d{4}-\d{2}-\d{2}/
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            return parseDate(match[0]);
          }
        }
        
        return null;
      }
      
      function detectPriority(text) {
        if (/urgent|critical|asap|emergency/i.test(text)) return 'Critical';
        if (/high|important/i.test(text)) return 'High';
        if (/low|minor|whenever/i.test(text)) return 'Low';
        return 'Medium';
      }
      
      function detectSeverity(text) {
        if (/critical|down|outage|emergency/i.test(text)) return 'critical';
        if (/high|urgent|broken/i.test(text)) return 'high';
        if (/medium|issue|problem/i.test(text)) return 'medium';
        return 'low';
      }
      
      return response ? [{json: response}] : [];
    `
  },
  
  // Send Slack message
  slackSender: {
    type: "n8n-nodes-base.slack",
    parameters: {
      channel: "={{$json.channel}}",
      text: "={{$json.text}}",
      blocks: "={{$json.blocks}}",
      thread_ts: "={{$json.thread_ts}}",
      attachments: "={{$json.attachments}}"
    }
  }
};
```

## SMS and WhatsApp Automation

### Example 4: Multi-Channel SMS Campaign System

**Scenario**: Orchestrate SMS campaigns across multiple providers with delivery optimization.

```javascript
// SMS Campaign Automation
const smsCampaignSystem = {
  name: "Multi-Provider SMS Orchestrator",
  
  // SMS campaign processor
  campaignProcessor: {
    type: "n8n-nodes-base.function",
    code: `
      // Intelligent SMS routing and delivery
      const campaign = $json;
      const recipients = campaign.recipients;
      
      // Provider configuration
      const providers = {
        twilio: {
          name: 'Twilio',
          priority: 1,
          costPerSMS: 0.0075,
          successRate: 0.98,
          capabilities: ['US', 'CA', 'UK', 'AU'],
          rateLimit: 100, // per second
          available: true
        },
        messagebird: {
          name: 'MessageBird',
          priority: 2,
          costPerSMS: 0.0065,
          successRate: 0.97,
          capabilities: ['EU', 'ASIA', 'AFRICA'],
          rateLimit: 200,
          available: true
        },
        vonage: {
          name: 'Vonage',
          priority: 3,
          costPerSMS: 0.0070,
          successRate: 0.96,
          capabilities: ['GLOBAL'],
          rateLimit: 150,
          available: true
        }
      };
      
      // Route messages to optimal provider
      const routedMessages = [];
      
      for (const recipient of recipients) {
        const route = await determineOptimalRoute(recipient, providers);
        
        // Format message with personalization
        const message = formatMessage(campaign.template, recipient);
        
        // Add tracking
        const trackingCode = generateTrackingCode(campaign.id, recipient.id);
        const trackedMessage = addTracking(message, trackingCode);
        
        routedMessages.push({
          provider: route.provider,
          recipient: recipient.phone,
          message: trackedMessage,
          countryCode: recipient.country,
          cost: route.cost,
          trackingCode: trackingCode,
          campaignId: campaign.id,
          scheduledTime: calculateOptimalSendTime(recipient)
        });
      }
      
      async function determineOptimalRoute(recipient, providers) {
        const country = recipient.country;
        const eligibleProviders = [];
        
        for (const [key, provider] of Object.entries(providers)) {
          if (!provider.available) continue;
          
          // Check if provider supports country
          if (provider.capabilities.includes('GLOBAL') || 
              provider.capabilities.includes(country)) {
            
            // Check provider health
            const health = await checkProviderHealth(key);
            if (health.status === 'healthy') {
              eligibleProviders.push({
                ...provider,
                key: key,
                score: calculateProviderScore(provider, health)
              });
            }
          }
        }
        
        // Sort by score and select best provider
        eligibleProviders.sort((a, b) => b.score - a.score);
        
        if (eligibleProviders.length === 0) {
          throw new Error(\`No provider available for country: \${country}\`);
        }
        
        return {
          provider: eligibleProviders[0].key,
          cost: eligibleProviders[0].costPerSMS
        };
      }
      
      async function checkProviderHealth(provider) {
        // Check provider status and recent performance
        const recentMetrics = await $db.query(
          'SELECT * FROM provider_metrics WHERE provider = ? AND timestamp > NOW() - INTERVAL 1 HOUR',
          [provider]
        );
        
        const successRate = recentMetrics.reduce((sum, m) => sum + m.success_rate, 0) / recentMetrics.length;
        const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
        
        return {
          status: successRate > 0.9 ? 'healthy' : 'degraded',
          successRate: successRate,
          latency: avgLatency
        };
      }
      
      function calculateProviderScore(provider, health) {
        // Multi-factor scoring
        const weights = {
          cost: 0.3,
          successRate: 0.4,
          priority: 0.2,
          latency: 0.1
        };
        
        const scores = {
          cost: (1 - provider.costPerSMS / 0.01) * 100, // Lower cost = higher score
          successRate: health.successRate * 100,
          priority: (4 - provider.priority) * 33.33,
          latency: Math.max(0, 100 - health.latency)
        };
        
        return Object.entries(weights).reduce((total, [factor, weight]) => 
          total + (scores[factor] * weight), 0
        );
      }
      
      function formatMessage(template, recipient) {
        let message = template;
        
        // Replace placeholders
        message = message.replace('{{name}}', recipient.name || 'Customer');
        message = message.replace('{{first_name}}', recipient.firstName || '');
        message = message.replace('{{last_name}}', recipient.lastName || '');
        
        // Dynamic content
        if (recipient.customFields) {
          for (const [key, value] of Object.entries(recipient.customFields)) {
            message = message.replace(\`{{\${key}}}\`, value);
          }
        }
        
        // Ensure message length compliance
        if (message.length > 160) {
          message = message.substring(0, 157) + '...';
        }
        
        return message;
      }
      
      function generateTrackingCode(campaignId, recipientId) {
        const data = \`\${campaignId}:\${recipientId}:\${Date.now()}\`;
        return Buffer.from(data).toString('base64').substring(0, 8);
      }
      
      function addTracking(message, trackingCode) {
        // Add tracking link if URL is present
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return message.replace(urlRegex, (url) => {
          return \`\${url}?t=\${trackingCode}\`;
        });
      }
      
      function calculateOptimalSendTime(recipient) {
        // Calculate optimal send time based on timezone and preferences
        const timezone = recipient.timezone || 'UTC';
        const preferredTime = recipient.preferredTime || '10:00';
        
        // Convert to recipient's local time
        const now = new Date();
        const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const [hours, minutes] = preferredTime.split(':').map(Number);
        
        localTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (localTime < now) {
          localTime.setDate(localTime.getDate() + 1);
        }
        
        return localTime.toISOString();
      }
      
      // Group messages by provider for batch sending
      const messagesByProvider = {};
      routedMessages.forEach(msg => {
        if (!messagesByProvider[msg.provider]) {
          messagesByProvider[msg.provider] = [];
        }
        messagesByProvider[msg.provider].push(msg);
      });
      
      return Object.entries(messagesByProvider).map(([provider, messages]) => ({
        json: {
          provider: provider,
          messages: messages,
          totalCost: messages.reduce((sum, m) => sum + m.cost, 0),
          messageCount: messages.length
        }
      }));
    `
  },
  
  // Provider-specific senders
  twilioSender: {
    type: "n8n-nodes-base.twilio",
    parameters: {
      operation: "sendSms",
      from: "={{$credentials.twilioPhoneNumber}}",
      to: "={{$json.recipient}}",
      body: "={{$json.message}}",
      options: {
        statusCallback: "https://webhook.example.com/sms/status",
        maxPrice: "0.01",
        validityPeriod: 14400
      }
    }
  }
};
```

## Microsoft Teams Integration

### Example 5: Teams Workflow Automation

**Scenario**: Automate Microsoft Teams workflows for notifications, approvals, and collaboration.

```javascript
// Microsoft Teams Automation
const teamsAutomation = {
  name: "Teams Collaboration Orchestrator",
  
  // Teams notification system
  notificationSystem: {
    type: "n8n-nodes-base.function",
    code: `
      // Intelligent Teams notification routing
      const notification = $json;
      
      // Determine notification type and routing
      const routingRules = {
        'deployment': {
          channel: 'engineering',
          template: 'deployment',
          mentions: ['devops-team'],
          priority: 'high'
        },
        'incident': {
          channel: 'incidents',
          template: 'incident',
          mentions: ['oncall', 'management'],
          priority: 'critical'
        },
        'approval': {
          channel: 'approvals',
          template: 'approval',
          mentions: notification.approvers || [],
          priority: 'medium'
        },
        'announcement': {
          channel: 'general',
          template: 'announcement',
          mentions: ['all'],
          priority: 'low'
        }
      };
      
      const routing = routingRules[notification.type] || routingRules.announcement;
      
      // Build adaptive card
      const card = buildAdaptiveCard(notification, routing.template);
      
      // Add interactive elements
      if (notification.requiresAction) {
        card.body.push(createActionButtons(notification));
      }
      
      function buildAdaptiveCard(data, template) {
        const templates = {
          deployment: {
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
              {
                type: 'ColumnSet',
                columns: [
                  {
                    type: 'Column',
                    width: 'auto',
                    items: [
                      {
                        type: 'Image',
                        url: 'https://icons.example.com/deploy.png',
                        size: 'Small'
                      }
                    ]
                  },
                  {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                      {
                        type: 'TextBlock',
                        text: '🚀 Deployment Notification',
                        weight: 'Bolder',
                        size: 'Medium'
                      },
                      {
                        type: 'TextBlock',
                        text: data.environment,
                        isSubtle: true
                      }
                    ]
                  }
                ]
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'Version', value: data.version },
                  { title: 'Branch', value: data.branch },
                  { title: 'Deployed By', value: data.deployedBy },
                  { title: 'Status', value: data.status }
                ]
              }
            ]
          },
          
          incident: {
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
              {
                type: 'TextBlock',
                text: '🚨 INCIDENT ALERT',
                size: 'Large',
                weight: 'Bolder',
                color: 'Attention'
              },
              {
                type: 'TextBlock',
                text: data.description,
                wrap: true
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'Severity', value: data.severity },
                  { title: 'Service', value: data.service },
                  { title: 'Impact', value: data.impact },
                  { title: 'Started', value: new Date(data.startTime).toLocaleString() }
                ]
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Dashboard',
                url: data.dashboardUrl
              },
              {
                type: 'Action.Submit',
                title: 'Acknowledge',
                data: {
                  action: 'acknowledge',
                  incidentId: data.id
                }
              }
            ]
          },
          
          approval: {
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
              {
                type: 'TextBlock',
                text: '✅ Approval Required',
                size: 'Large',
                weight: 'Bolder'
              },
              {
                type: 'TextBlock',
                text: data.title,
                size: 'Medium'
              },
              {
                type: 'TextBlock',
                text: data.description,
                wrap: true,
                isSubtle: true
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'Requester', value: data.requester },
                  { title: 'Type', value: data.approvalType },
                  { title: 'Amount', value: data.amount || 'N/A' },
                  { title: 'Due Date', value: data.dueDate }
                ]
              }
            ],
            actions: [
              {
                type: 'Action.Submit',
                title: 'Approve',
                style: 'positive',
                data: {
                  action: 'approve',
                  approvalId: data.id
                }
              },
              {
                type: 'Action.Submit',
                title: 'Reject',
                style: 'destructive',
                data: {
                  action: 'reject',
                  approvalId: data.id
                }
              },
              {
                type: 'Action.ShowCard',
                title: 'Add Comment',
                card: {
                  type: 'AdaptiveCard',
                  body: [
                    {
                      type: 'Input.Text',
                      id: 'comment',
                      placeholder: 'Add your comment...',
                      isMultiline: true
                    }
                  ],
                  actions: [
                    {
                      type: 'Action.Submit',
                      title: 'Submit Comment',
                      data: {
                        action: 'comment',
                        approvalId: data.id
                      }
                    }
                  ]
                }
              }
            ]
          }
        };
        
        return templates[template] || templates.announcement;
      }
      
      function createActionButtons(notification) {
        const actions = [];
        
        if (notification.actions) {
          notification.actions.forEach(action => {
            if (action.type === 'url') {
              actions.push({
                type: 'Action.OpenUrl',
                title: action.title,
                url: action.url
              });
            } else if (action.type === 'submit') {
              actions.push({
                type: 'Action.Submit',
                title: action.title,
                data: action.data
              });
            }
          });
        }
        
        return {
          type: 'ActionSet',
          actions: actions
        };
      }
      
      // Add mentions
      const mentions = routing.mentions.map(mention => ({
        type: 'mention',
        text: \`<at>\${mention}</at>\`,
        mentioned: {
          id: mention,
          name: mention
        }
      }));
      
      return [{
        json: {
          channel: routing.channel,
          card: card,
          mentions: mentions,
          priority: routing.priority,
          notification: notification
        }
      }];
    `
  }
};
```

## Push Notification Orchestration

### Example 6: Multi-Platform Push Notification System

**Scenario**: Orchestrate push notifications across mobile and web platforms with targeting and analytics.

```javascript
// Push Notification System
const pushNotificationSystem = {
  name: "Omnichannel Push Orchestrator",
  
  // Push notification processor
  pushProcessor: {
    type: "n8n-nodes-base.function",
    code: `
      // Intelligent push notification targeting
      const campaign = $json;
      
      // Segment users for targeting
      const segments = await segmentUsers(campaign.targeting);
      
      // Prepare notifications for each platform
      const notifications = {
        ios: [],
        android: [],
        web: []
      };
      
      for (const user of segments.users) {
        const personalizedContent = personalizeNotification(campaign.content, user);
        
        // Create platform-specific payloads
        if (user.devices.ios) {
          notifications.ios.push(createIOSPayload(personalizedContent, user));
        }
        
        if (user.devices.android) {
          notifications.android.push(createAndroidPayload(personalizedContent, user));
        }
        
        if (user.devices.web) {
          notifications.web.push(createWebPayload(personalizedContent, user));
        }
      }
      
      async function segmentUsers(targeting) {
        let query = 'SELECT * FROM users WHERE push_enabled = true';
        const params = [];
        
        if (targeting.segments) {
          query += ' AND segment IN (?)';
          params.push(targeting.segments);
        }
        
        if (targeting.lastActive) {
          query += ' AND last_active > DATE_SUB(NOW(), INTERVAL ? DAY)';
          params.push(targeting.lastActive);
        }
        
        if (targeting.geoLocation) {
          query += ' AND country = ?';
          params.push(targeting.geoLocation);
        }
        
        const users = await $db.query(query, params);
        
        // Apply additional filtering
        return {
          users: users.filter(user => {
            if (targeting.minEngagement && user.engagement_score < targeting.minEngagement) {
              return false;
            }
            
            if (targeting.timezone) {
              const userTime = getUserLocalTime(user.timezone);
              const isGoodTime = userTime.hour >= 9 && userTime.hour <= 21;
              if (!isGoodTime) return false;
            }
            
            return true;
          })
        };
      }
      
      function personalizeNotification(content, user) {
        let title = content.title;
        let body = content.body;
        let data = content.data || {};
        
        // Basic personalization
        title = title.replace('{{name}}', user.name || 'Friend');
        body = body.replace('{{name}}', user.name || 'Friend');
        
        // Dynamic content based on user attributes
        if (user.preferences) {
          if (user.preferences.category) {
            body = body.replace('{{category}}', user.preferences.category);
          }
        }
        
        // Add user-specific data
        data.userId = user.id;
        data.segment = user.segment;
        data.timestamp = Date.now();
        
        return { title, body, data };
      }
      
      function createIOSPayload(content, user) {
        return {
          token: user.devices.ios.token,
          notification: {
            alert: {
              title: content.title,
              body: content.body
            },
            badge: user.unreadCount || 0,
            sound: 'default',
            category: campaign.category,
            threadId: campaign.threadId
          },
          data: content.data,
          priority: campaign.priority === 'high' ? 10 : 5,
          expiry: Math.floor(Date.now() / 1000) + 86400
        };
      }
      
      function createAndroidPayload(content, user) {
        return {
          token: user.devices.android.token,
          notification: {
            title: content.title,
            body: content.body,
            icon: 'ic_notification',
            color: '#FF5722',
            tag: campaign.tag,
            priority: campaign.priority
          },
          data: content.data,
          android: {
            ttl: '86400s',
            notification: {
              click_action: campaign.action,
              channel_id: campaign.channelId || 'default'
            }
          }
        };
      }
      
      function createWebPayload(content, user) {
        return {
          subscription: user.devices.web.subscription,
          notification: {
            title: content.title,
            body: content.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: campaign.tag,
            requireInteraction: campaign.requireInteraction || false,
            actions: campaign.actions || [],
            data: content.data
          },
          options: {
            TTL: 86400,
            urgency: campaign.priority
          }
        };
      }
      
      function getUserLocalTime(timezone) {
        const now = new Date();
        const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        return {
          hour: localTime.getHours(),
          day: localTime.getDay()
        };
      }
      
      return [
        { json: { platform: 'ios', notifications: notifications.ios } },
        { json: { platform: 'android', notifications: notifications.android } },
        { json: { platform: 'web', notifications: notifications.web } }
      ];
    `
  }
};
```

## Communication Analytics and Reporting

### Example 7: Unified Communication Analytics

**Scenario**: Track and analyze communication metrics across all channels.

```javascript
// Communication Analytics System
const analyticsSystem = {
  name: "Communication Analytics Pipeline",
  
  // Analytics collector
  analyticsCollector: {
    type: "n8n-nodes-base.function",
    code: `
      // Collect metrics from all communication channels
      const period = $json.period || '24h';
      
      const metrics = {
        email: await collectEmailMetrics(period),
        slack: await collectSlackMetrics(period),
        sms: await collectSMSMetrics(period),
        push: await collectPushMetrics(period),
        overall: {}
      };
      
      // Calculate overall metrics
      metrics.overall = calculateOverallMetrics(metrics);
      
      // Generate insights
      metrics.insights = generateInsights(metrics);
      
      async function collectEmailMetrics(period) {
        const stats = await $db.query(\`
          SELECT 
            COUNT(*) as total_sent,
            SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) as opened,
            SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked,
            SUM(CASE WHEN bounced = 1 THEN 1 ELSE 0 END) as bounced,
            SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) as unsubscribed,
            AVG(TIMESTAMPDIFF(MINUTE, sent_at, opened_at)) as avg_open_time
          FROM email_logs
          WHERE sent_at > DATE_SUB(NOW(), INTERVAL \${parsePeriod(period)} HOUR)
        \`);
        
        return {
          sent: stats[0].total_sent,
          delivered: stats[0].total_sent - stats[0].bounced,
          openRate: (stats[0].opened / stats[0].total_sent * 100).toFixed(2),
          clickRate: (stats[0].clicked / stats[0].opened * 100).toFixed(2),
          bounceRate: (stats[0].bounced / stats[0].total_sent * 100).toFixed(2),
          unsubscribeRate: (stats[0].unsubscribed / stats[0].total_sent * 100).toFixed(2),
          avgOpenTime: stats[0].avg_open_time
        };
      }
      
      async function collectSlackMetrics(period) {
        const messages = await $db.query(\`
          SELECT 
            COUNT(*) as total_messages,
            COUNT(DISTINCT channel) as active_channels,
            COUNT(DISTINCT user_id) as active_users,
            AVG(response_time) as avg_response_time,
            SUM(CASE WHEN has_thread = 1 THEN 1 ELSE 0 END) as threads_created
          FROM slack_messages
          WHERE timestamp > DATE_SUB(NOW(), INTERVAL \${parsePeriod(period)} HOUR)
        \`);
        
        return {
          messages: messages[0].total_messages,
          activeChannels: messages[0].active_channels,
          activeUsers: messages[0].active_users,
          avgResponseTime: messages[0].avg_response_time,
          threadsCreated: messages[0].threads_created,
          engagementRate: (messages[0].threads_created / messages[0].total_messages * 100).toFixed(2)
        };
      }
      
      async function collectSMSMetrics(period) {
        const sms = await $db.query(\`
          SELECT 
            COUNT(*) as total_sent,
            SUM(CASE WHEN delivered = 1 THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN failed = 1 THEN 1 ELSE 0 END) as failed,
            AVG(cost) as avg_cost,
            COUNT(DISTINCT provider) as providers_used
          FROM sms_logs
          WHERE sent_at > DATE_SUB(NOW(), INTERVAL \${parsePeriod(period)} HOUR)
        \`);
        
        return {
          sent: sms[0].total_sent,
          delivered: sms[0].delivered,
          deliveryRate: (sms[0].delivered / sms[0].total_sent * 100).toFixed(2),
          failureRate: (sms[0].failed / sms[0].total_sent * 100).toFixed(2),
          avgCost: sms[0].avg_cost.toFixed(4),
          totalCost: (sms[0].total_sent * sms[0].avg_cost).toFixed(2),
          providersUsed: sms[0].providers_used
        };
      }
      
      async function collectPushMetrics(period) {
        const push = await $db.query(\`
          SELECT 
            COUNT(*) as total_sent,
            SUM(CASE WHEN delivered = 1 THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) as opened,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted,
            COUNT(DISTINCT platform) as platforms
          FROM push_logs
          WHERE sent_at > DATE_SUB(NOW(), INTERVAL \${parsePeriod(period)} HOUR)
        \`);
        
        return {
          sent: push[0].total_sent,
          delivered: push[0].delivered,
          opened: push[0].opened,
          deliveryRate: (push[0].delivered / push[0].total_sent * 100).toFixed(2),
          openRate: (push[0].opened / push[0].delivered * 100).toFixed(2),
          conversionRate: (push[0].converted / push[0].opened * 100).toFixed(2),
          platforms: push[0].platforms
        };
      }
      
      function calculateOverallMetrics(metrics) {
        const totalMessages = 
          metrics.email.sent + 
          metrics.slack.messages + 
          metrics.sms.sent + 
          metrics.push.sent;
        
        const totalCost = 
          parseFloat(metrics.sms.totalCost || 0) +
          (metrics.email.sent * 0.0001) + // Estimated email cost
          (metrics.push.sent * 0.00001); // Estimated push cost
        
        return {
          totalMessages: totalMessages,
          totalCost: totalCost.toFixed(2),
          avgEngagement: (
            (parseFloat(metrics.email.openRate) +
             parseFloat(metrics.slack.engagementRate) +
             parseFloat(metrics.push.openRate)) / 3
          ).toFixed(2),
          channelDistribution: {
            email: (metrics.email.sent / totalMessages * 100).toFixed(2),
            slack: (metrics.slack.messages / totalMessages * 100).toFixed(2),
            sms: (metrics.sms.sent / totalMessages * 100).toFixed(2),
            push: (metrics.push.sent / totalMessages * 100).toFixed(2)
          }
        };
      }
      
      function generateInsights(metrics) {
        const insights = [];
        
        // Email insights
        if (parseFloat(metrics.email.openRate) < 20) {
          insights.push({
            channel: 'email',
            type: 'warning',
            message: 'Email open rate is below industry average (20%)',
            recommendation: 'Consider improving subject lines and send timing'
          });
        }
        
        // SMS insights
        if (parseFloat(metrics.sms.failureRate) > 5) {
          insights.push({
            channel: 'sms',
            type: 'alert',
            message: 'High SMS failure rate detected',
            recommendation: 'Review phone number validation and provider health'
          });
        }
        
        // Cost insights
        if (parseFloat(metrics.overall.totalCost) > 1000) {
          insights.push({
            channel: 'overall',
            type: 'info',
            message: 'Communication costs exceed $1000',
            recommendation: 'Consider optimizing channel mix for cost efficiency'
          });
        }
        
        return insights;
      }
      
      function parsePeriod(period) {
        const units = {
          '1h': 1,
          '24h': 24,
          '7d': 168,
          '30d': 720
        };
        return units[period] || 24;
      }
      
      return [{json: metrics}];
    `
  }
};
```

## Best Practices for Communication Automation

### 1. Message Personalization
- Use dynamic content based on user data
- Implement A/B testing for optimization
- Respect user preferences and timezones

### 2. Delivery Optimization
- Implement intelligent routing
- Use fallback channels
- Monitor delivery rates

### 3. Compliance and Privacy
- Handle unsubscribe requests
- Implement opt-in/opt-out mechanisms
- Comply with regulations (GDPR, CAN-SPAM)

### 4. Performance Monitoring
- Track key metrics per channel
- Monitor costs and ROI
- Implement alerting for failures

### 5. User Experience
- Avoid message fatigue
- Ensure message relevance
- Provide clear CTAs

## Conclusion

n8n transforms communication automation by providing a unified platform to orchestrate messages across all channels. From sophisticated email campaigns to real-time Slack notifications and SMS delivery optimization, n8n enables organizations to build communication workflows that scale with their needs while maintaining personalization and efficiency.

The key to successful communication automation lies in understanding each channel's strengths, implementing intelligent routing, and continuously optimizing based on metrics and user feedback.