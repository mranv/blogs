---
author: Anubhav Gain
category: aws
description: Complete guide to Amazon SQS - managed message queuing service for decoupling applications with standard and FIFO queues, dead letter queues, and integration patterns.
draft: false
featured: true
lang: en
pubDatetime: '2024-08-20T17:00:00+05:30'
slug: complete-guide-to-amazon-sqs
tags:
- aws
- sqs
- queues
- messaging
- microservices
- decoupling
- asynchronous
title: 'Complete Guide to Amazon SQS: Scalable Message Queuing'
---

# Complete Guide to Amazon SQS: Scalable Message Queuing

Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. SQS eliminates the complexity and overhead associated with managing and operating message-oriented middleware.

## Overview

SQS offers two types of message queues: Standard queues offer maximum throughput, best-effort ordering, and at-least-once delivery. FIFO queues are designed to guarantee that messages are processed exactly once, in the exact order they are sent.

## Key Benefits

### 1. **Fully Managed**
- No infrastructure to manage
- Automatic scaling based on demand
- High availability across multiple AZs
- Built-in redundancy and reliability

### 2. **Scalability**
- Handle any volume of messages
- Scale from 1 to 10,000+ messages per second
- No capacity planning required
- Pay only for what you use

### 3. **Security**
- Server-side encryption (SSE)
- IAM access control
- VPC endpoints for private access
- Message-level permissions

### 4. **Flexibility**
- Standard and FIFO queue types
- Dead letter queues for error handling
- Message visibility timeout
- Long polling for cost efficiency

## Queue Types

### 1. **Standard Queues**
```yaml
# Standard SQS Queue
StandardQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: standard-queue
    MessageRetentionPeriod: 1209600  # 14 days
    VisibilityTimeoutSeconds: 300    # 5 minutes
    ReceiveMessageWaitTimeSeconds: 20 # Long polling
    KmsMasterKeyId: !Ref SQSKMSKey
    Tags:
      - Key: Environment
        Value: Production
      - Key: Application
        Value: MyApp

# Dead Letter Queue
DeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: standard-queue-dlq
    MessageRetentionPeriod: 1209600

# Redrive Policy
RedrivePolicy:
  Type: AWS::SQS::QueuePolicy
  Properties:
    Queues:
      - !Ref StandardQueue
    PolicyDocument:
      Statement:
        - Effect: Allow
          Action: sqs:*
          Resource: !GetAtt StandardQueue.Arn
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
```

### 2. **FIFO Queues**
```yaml
# FIFO Queue for ordered processing
FIFOQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: fifo-queue.fifo
    FifoQueue: true
    ContentBasedDeduplication: true
    MessageRetentionPeriod: 1209600
    VisibilityTimeoutSeconds: 300
    KmsMasterKeyId: !Ref SQSKMSKey
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt FIFODeadLetterQueue.Arn
      maxReceiveCount: 3

FIFODeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: fifo-queue-dlq.fifo
    FifoQueue: true
    MessageRetentionPeriod: 1209600
```

## Message Operations

### 1. **Sending Messages**
```python
import boto3
import json
import uuid
from datetime import datetime

sqs = boto3.client('sqs')

def send_standard_message(queue_url, message_body, attributes=None):
    """
    Send message to standard queue
    """
    params = {
        'QueueUrl': queue_url,
        'MessageBody': json.dumps(message_body) if isinstance(message_body, dict) else message_body
    }
    
    if attributes:
        params['MessageAttributes'] = {}
        for key, value in attributes.items():
            if isinstance(value, str):
                params['MessageAttributes'][key] = {
                    'StringValue': value,
                    'DataType': 'String'
                }
            elif isinstance(value, (int, float)):
                params['MessageAttributes'][key] = {
                    'StringValue': str(value),
                    'DataType': 'Number'
                }
    
    response = sqs.send_message(**params)
    return response['MessageId']

def send_fifo_message(queue_url, message_body, group_id, deduplication_id=None, attributes=None):
    """
    Send message to FIFO queue
    """
    params = {
        'QueueUrl': queue_url,
        'MessageBody': json.dumps(message_body) if isinstance(message_body, dict) else message_body,
        'MessageGroupId': group_id
    }
    
    if deduplication_id:
        params['MessageDeduplicationId'] = deduplication_id
    
    if attributes:
        params['MessageAttributes'] = {}
        for key, value in attributes.items():
            if isinstance(value, str):
                params['MessageAttributes'][key] = {
                    'StringValue': value,
                    'DataType': 'String'
                }
    
    response = sqs.send_message(**params)
    return response['MessageId']

def send_batch_messages(queue_url, messages, is_fifo=False):
    """
    Send multiple messages in batch (up to 10)
    """
    entries = []
    
    for i, message in enumerate(messages[:10]):  # Limit to 10 messages
        entry = {
            'Id': str(i),
            'MessageBody': json.dumps(message['body']) if isinstance(message['body'], dict) else message['body']
        }
        
        if message.get('attributes'):
            entry['MessageAttributes'] = {}
            for key, value in message['attributes'].items():
                entry['MessageAttributes'][key] = {
                    'StringValue': str(value),
                    'DataType': 'String' if isinstance(value, str) else 'Number'
                }
        
        if is_fifo:
            entry['MessageGroupId'] = message.get('group_id', 'default')
            if message.get('deduplication_id'):
                entry['MessageDeduplicationId'] = message['deduplication_id']
        
        entries.append(entry)
    
    response = sqs.send_message_batch(
        QueueUrl=queue_url,
        Entries=entries
    )
    
    return {
        'successful': response.get('Successful', []),
        'failed': response.get('Failed', [])
    }

# Example usage
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/standard-queue'

# Send standard message
message_id = send_standard_message(
    queue_url,
    {
        'order_id': 'ORDER-123456',
        'customer_id': 'CUST-789',
        'amount': 99.99,
        'timestamp': datetime.utcnow().isoformat()
    },
    attributes={
        'source': 'order-service',
        'priority': 'high'
    }
)

# Send FIFO message
fifo_queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/fifo-queue.fifo'
message_id = send_fifo_message(
    fifo_queue_url,
    {'action': 'process_payment', 'order_id': 'ORDER-123456'},
    group_id='payment-processing',
    deduplication_id=f'payment-{uuid.uuid4()}'
)
```

### 2. **Receiving Messages**
```python
import time
import json

def receive_messages(queue_url, max_messages=10, wait_time=20):
    """
    Receive messages from queue with long polling
    """
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=max_messages,
        WaitTimeSeconds=wait_time,
        MessageAttributeNames=['All'],
        AttributeNames=['All']
    )
    
    return response.get('Messages', [])

def process_messages(queue_url, processor_function):
    """
    Continuous message processing loop
    """
    while True:
        try:
            messages = receive_messages(queue_url)
            
            if not messages:
                print("No messages received, continuing...")
                continue
            
            for message in messages:
                try:
                    # Parse message body
                    body = json.loads(message['Body'])
                    receipt_handle = message['ReceiptHandle']
                    message_attributes = message.get('MessageAttributes', {})
                    
                    # Process message
                    result = processor_function(body, message_attributes)
                    
                    if result.get('success', False):
                        # Delete message after successful processing
                        delete_message(queue_url, receipt_handle)
                        print(f"Successfully processed message: {message['MessageId']}")
                    else:
                        print(f"Failed to process message: {message['MessageId']}")
                        # Message will become visible again after visibility timeout
                
                except json.JSONDecodeError:
                    print(f"Invalid JSON in message: {message['MessageId']}")
                    delete_message(queue_url, receipt_handle)  # Remove invalid message
                except Exception as e:
                    print(f"Error processing message {message['MessageId']}: {e}")
        
        except KeyboardInterrupt:
            print("Shutting down message processor...")
            break
        except Exception as e:
            print(f"Error receiving messages: {e}")
            time.sleep(5)  # Wait before retrying

def delete_message(queue_url, receipt_handle):
    """
    Delete processed message from queue
    """
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle
    )

def delete_batch_messages(queue_url, messages):
    """
    Delete multiple messages in batch
    """
    entries = [
        {
            'Id': str(i),
            'ReceiptHandle': msg['ReceiptHandle']
        }
        for i, msg in enumerate(messages[:10])  # Limit to 10
    ]
    
    response = sqs.delete_message_batch(
        QueueUrl=queue_url,
        Entries=entries
    )
    
    return response

# Example message processor
def order_processor(message_body, attributes):
    """
    Example order processing function
    """
    try:
        order_id = message_body.get('order_id')
        customer_id = message_body.get('customer_id')
        amount = message_body.get('amount')
        
        print(f"Processing order {order_id} for customer {customer_id}, amount: ${amount}")
        
        # Simulate processing
        time.sleep(1)
        
        # Simulate random failures for testing
        import random
        if random.random() > 0.9:  # 10% failure rate
            raise Exception("Simulated processing error")
        
        return {'success': True}
    
    except Exception as e:
        print(f"Processing failed: {e}")
        return {'success': False}

# Start processing messages
# process_messages(queue_url, order_processor)
```

### 3. **Message Visibility and Handling**
```python
def change_message_visibility(queue_url, receipt_handle, visibility_timeout):
    """
    Change message visibility timeout
    """
    sqs.change_message_visibility(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle,
        VisibilityTimeout=visibility_timeout
    )

def extend_processing_time(queue_url, receipt_handle, additional_seconds=300):
    """
    Extend message processing time
    """
    change_message_visibility(queue_url, receipt_handle, additional_seconds)

def process_with_extended_timeout(queue_url, processor_function):
    """
    Process messages with ability to extend timeout
    """
    messages = receive_messages(queue_url)
    
    for message in messages:
        try:
            body = json.loads(message['Body'])
            receipt_handle = message['ReceiptHandle']
            
            # Start processing
            start_time = time.time()
            
            # Check if processing is taking too long and extend timeout
            if time.time() - start_time > 240:  # If processing > 4 minutes
                extend_processing_time(queue_url, receipt_handle, 600)  # Extend by 10 minutes
            
            result = processor_function(body)
            
            if result.get('success'):
                delete_message(queue_url, receipt_handle)
            
        except Exception as e:
            print(f"Error processing message: {e}")
```

## Advanced Features

### 1. **Dead Letter Queues**
```yaml
# Queue with dead letter queue configuration
MainQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: main-processing-queue
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt MainDeadLetterQueue.Arn
      maxReceiveCount: 3  # Send to DLQ after 3 failed attempts
    VisibilityTimeoutSeconds: 300

MainDeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: main-processing-dlq
    MessageRetentionPeriod: 1209600  # Keep for 14 days for analysis
```

```python
def analyze_dead_letter_queue(dlq_url):
    """
    Analyze messages in dead letter queue
    """
    messages = receive_messages(dlq_url, max_messages=10)
    
    for message in messages:
        body = json.loads(message['Body'])
        attributes = message.get('Attributes', {})
        
        print(f"Dead Letter Message Analysis:")
        print(f"  Message ID: {message['MessageId']}")
        print(f"  First Received: {attributes.get('ApproximateFirstReceiveTimestamp')}")
        print(f"  Receive Count: {attributes.get('ApproximateReceiveCount')}")
        print(f"  Body: {json.dumps(body, indent=2)}")
        
        # Optionally reprocess or log for manual review
        # reprocess_failed_message(body)

def redrive_messages_from_dlq(source_dlq_url, target_queue_url, max_messages=10):
    """
    Move messages from DLQ back to main queue for reprocessing
    """
    messages = receive_messages(source_dlq_url, max_messages)
    redriven_count = 0
    
    for message in messages:
        try:
            # Send to target queue
            sqs.send_message(
                QueueUrl=target_queue_url,
                MessageBody=message['Body'],
                MessageAttributes=message.get('MessageAttributes', {})
            )
            
            # Delete from DLQ
            delete_message(source_dlq_url, message['ReceiptHandle'])
            redriven_count += 1
            
        except Exception as e:
            print(f"Failed to redrive message {message['MessageId']}: {e}")
    
    return redriven_count
```

### 2. **Message Filtering and Routing**
```python
def route_messages_by_type(queue_url, processors):
    """
    Route messages to different processors based on message type
    """
    messages = receive_messages(queue_url)
    
    for message in messages:
        try:
            body = json.loads(message['Body'])
            message_type = body.get('type', 'default')
            
            processor = processors.get(message_type, processors.get('default'))
            
            if processor:
                result = processor(body, message.get('MessageAttributes', {}))
                
                if result.get('success'):
                    delete_message(queue_url, message['ReceiptHandle'])
                else:
                    # Let message return to queue for retry
                    print(f"Processing failed for message type {message_type}")
            else:
                print(f"No processor found for message type: {message_type}")
                delete_message(queue_url, message['ReceiptHandle'])  # Remove unknown types
                
        except Exception as e:
            print(f"Error routing message: {e}")

# Example processors
processors = {
    'order': lambda body, attrs: {'success': process_order(body)},
    'payment': lambda body, attrs: {'success': process_payment(body)},
    'notification': lambda body, attrs: {'success': send_notification(body)},
    'default': lambda body, attrs: {'success': log_unknown_message(body)}
}

# route_messages_by_type(queue_url, processors)
```

### 3. **Queue Monitoring and Scaling**
```python
def get_queue_metrics(queue_url):
    """
    Get queue metrics for monitoring
    """
    response = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=[
            'ApproximateNumberOfMessages',
            'ApproximateNumberOfMessagesNotVisible',
            'ApproximateNumberOfMessagesDelayed',
            'CreatedTimestamp',
            'LastModifiedTimestamp',
            'ApproximateAgeOfOldestMessage'
        ]
    )
    
    attributes = response['Attributes']
    
    return {
        'visible_messages': int(attributes.get('ApproximateNumberOfMessages', 0)),
        'in_flight_messages': int(attributes.get('ApproximateNumberOfMessagesNotVisible', 0)),
        'delayed_messages': int(attributes.get('ApproximateNumberOfMessagesDelayed', 0)),
        'oldest_message_age': int(attributes.get('ApproximateAgeOfOldestMessage', 0)),
        'total_messages': int(attributes.get('ApproximateNumberOfMessages', 0)) + 
                         int(attributes.get('ApproximateNumberOfMessagesNotVisible', 0))
    }

def auto_scale_consumers(queue_url, min_consumers=1, max_consumers=10, target_messages_per_consumer=100):
    """
    Auto-scale consumers based on queue depth
    """
    metrics = get_queue_metrics(queue_url)
    total_messages = metrics['total_messages']
    
    # Calculate desired number of consumers
    desired_consumers = max(
        min_consumers,
        min(max_consumers, (total_messages // target_messages_per_consumer) + 1)
    )
    
    print(f"Queue metrics: {metrics}")
    print(f"Recommended consumers: {desired_consumers}")
    
    return desired_consumers

# Example CloudWatch custom metrics
def publish_queue_metrics(queue_name, metrics):
    """
    Publish custom metrics to CloudWatch
    """
    cloudwatch = boto3.client('cloudwatch')
    
    cloudwatch.put_metric_data(
        Namespace='SQS/Custom',
        MetricData=[
            {
                'MetricName': 'VisibleMessages',
                'Value': metrics['visible_messages'],
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'QueueName', 'Value': queue_name}
                ]
            },
            {
                'MetricName': 'InFlightMessages',
                'Value': metrics['in_flight_messages'],
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'QueueName', 'Value': queue_name}
                ]
            },
            {
                'MetricName': 'OldestMessageAge',
                'Value': metrics['oldest_message_age'],
                'Unit': 'Seconds',
                'Dimensions': [
                    {'Name': 'QueueName', 'Value': queue_name}
                ]
            }
        ]
    )
```

## Integration Patterns

### 1. **SQS with Lambda**
```yaml
# Lambda function triggered by SQS
SQSProcessor:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: sqs-message-processor
    Runtime: python3.11
    Handler: index.lambda_handler
    Code:
      ZipFile: |
        import json
        import boto3
        
        def lambda_handler(event, context):
            processed = 0
            failed = 0
            
            for record in event['Records']:
                try:
                    body = json.loads(record['body'])
                    message_id = record['messageId']
                    
                    # Process message
                    result = process_message(body)
                    
                    if result['success']:
                        processed += 1
                    else:
                        failed += 1
                        
                except Exception as e:
                    print(f"Error processing record: {e}")
                    failed += 1
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'processed': processed,
                    'failed': failed
                })
            }
        
        def process_message(body):
            # Your processing logic here
            return {'success': True}

# Event source mapping
SQSEventSourceMapping:
  Type: AWS::Lambda::EventSourceMapping
  Properties:
    EventSourceArn: !GetAtt ProcessingQueue.Arn
    FunctionName: !GetAtt SQSProcessor.Arn
    BatchSize: 10
    MaximumBatchingWindowInSeconds: 5
    ReportBatchItemFailures: true
```

### 2. **SQS with SNS Fanout**
```yaml
# SNS to SQS fanout pattern
NotificationTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: OrderEvents

# Multiple SQS queues for different processing
OrderProcessingQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: order-processing
    
EmailQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: email-notifications
    
AnalyticsQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: analytics-events

# SNS subscriptions
OrderProcessingSubscription:
  Type: AWS::SNS::Subscription
  Properties:
    Protocol: sqs
    Endpoint: !GetAtt OrderProcessingQueue.Arn
    TopicArn: !Ref NotificationTopic

EmailSubscription:
  Type: AWS::SNS::Subscription
  Properties:
    Protocol: sqs
    Endpoint: !GetAtt EmailQueue.Arn
    TopicArn: !Ref NotificationTopic
```

### 3. **SQS with Step Functions**
```python
# Step Functions integration
def trigger_step_function_from_sqs():
    """
    Process SQS messages and trigger Step Functions
    """
    stepfunctions = boto3.client('stepfunctions')
    
    messages = receive_messages(queue_url)
    
    for message in messages:
        try:
            body = json.loads(message['Body'])
            
            # Start Step Function execution
            response = stepfunctions.start_execution(
                stateMachineArn='arn:aws:states:region:account:stateMachine:MyWorkflow',
                name=f"execution-{message['MessageId']}",
                input=json.dumps({
                    'messageId': message['MessageId'],
                    'payload': body,
                    'source': 'sqs'
                })
            )
            
            print(f"Started execution: {response['executionArn']}")
            delete_message(queue_url, message['ReceiptHandle'])
            
        except Exception as e:
            print(f"Failed to process message: {e}")
```

## Performance Optimization

### 1. **Batch Processing**
```python
class BatchMessageProcessor:
    def __init__(self, queue_url, batch_size=10):
        self.queue_url = queue_url
        self.batch_size = batch_size
        self.sqs = boto3.client('sqs')
    
    def process_in_batches(self, processor_function):
        """
        Process messages in batches for better throughput
        """
        while True:
            # Receive batch of messages
            messages = self.receive_message_batch()
            
            if not messages:
                time.sleep(1)
                continue
            
            # Process batch
            results = self.process_batch(messages, processor_function)
            
            # Delete successfully processed messages
            self.cleanup_batch(messages, results)
    
    def receive_message_batch(self):
        """
        Receive up to batch_size messages
        """
        response = self.sqs.receive_message(
            QueueUrl=self.queue_url,
            MaxNumberOfMessages=self.batch_size,
            WaitTimeSeconds=20,
            MessageAttributeNames=['All']
        )
        return response.get('Messages', [])
    
    def process_batch(self, messages, processor_function):
        """
        Process all messages in batch
        """
        results = []
        
        for message in messages:
            try:
                body = json.loads(message['Body'])
                result = processor_function(body)
                results.append({
                    'message': message,
                    'success': result.get('success', False)
                })
            except Exception as e:
                results.append({
                    'message': message,
                    'success': False,
                    'error': str(e)
                })
        
        return results
    
    def cleanup_batch(self, messages, results):
        """
        Delete successfully processed messages in batch
        """
        successful_messages = [
            r['message'] for r in results if r['success']
        ]
        
        if successful_messages:
            delete_batch_messages(self.queue_url, successful_messages)

# Usage
processor = BatchMessageProcessor(queue_url, batch_size=10)
processor.process_in_batches(order_processor)
```

### 2. **Connection Pooling**
```python
import threading
from concurrent.futures import ThreadPoolExecutor
from queue import Queue

class SQSConnectionPool:
    def __init__(self, max_connections=10):
        self.connections = Queue(maxsize=max_connections)
        self.max_connections = max_connections
        self._initialize_connections()
    
    def _initialize_connections(self):
        """
        Initialize connection pool
        """
        for _ in range(self.max_connections):
            conn = boto3.client('sqs')
            self.connections.put(conn)
    
    def get_connection(self):
        """
        Get connection from pool
        """
        return self.connections.get()
    
    def return_connection(self, conn):
        """
        Return connection to pool
        """
        self.connections.put(conn)
    
    def process_with_pool(self, queue_url, processor_function, num_workers=5):
        """
        Process messages using connection pool and multiple workers
        """
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = []
            
            for _ in range(num_workers):
                future = executor.submit(
                    self._worker_process,
                    queue_url,
                    processor_function
                )
                futures.append(future)
            
            # Wait for all workers to complete
            for future in futures:
                try:
                    future.result()
                except Exception as e:
                    print(f"Worker failed: {e}")
    
    def _worker_process(self, queue_url, processor_function):
        """
        Individual worker processing messages
        """
        while True:
            conn = self.get_connection()
            try:
                response = conn.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=10,
                    WaitTimeSeconds=20
                )
                
                messages = response.get('Messages', [])
                
                for message in messages:
                    try:
                        body = json.loads(message['Body'])
                        result = processor_function(body)
                        
                        if result.get('success'):
                            conn.delete_message(
                                QueueUrl=queue_url,
                                ReceiptHandle=message['ReceiptHandle']
                            )
                    except Exception as e:
                        print(f"Processing error: {e}")
                        
            finally:
                self.return_connection(conn)

# Usage
pool = SQSConnectionPool(max_connections=10)
pool.process_with_pool(queue_url, order_processor, num_workers=5)
```

## Monitoring and Troubleshooting

### 1. **CloudWatch Metrics and Alarms**
```yaml
# CloudWatch alarms for SQS monitoring
QueueDepthAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: SQS-High-Queue-Depth
    AlarmDescription: SQS queue has too many messages
    MetricName: ApproximateNumberOfVisibleMessages
    Namespace: AWS/SQS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 1000
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: QueueName
        Value: !GetAtt ProcessingQueue.QueueName

OldMessagesAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: SQS-Old-Messages
    AlarmDescription: Messages are too old in queue
    MetricName: ApproximateAgeOfOldestMessage
    Namespace: AWS/SQS
    Statistic: Maximum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 3600  # 1 hour
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: QueueName
        Value: !GetAtt ProcessingQueue.QueueName
```

### 2. **Queue Analysis Tools**
```python
def analyze_queue_performance(queue_url, duration_minutes=60):
    """
    Analyze queue performance over time
    """
    cloudwatch = boto3.client('cloudwatch')
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=duration_minutes)
    
    metrics = [
        'ApproximateNumberOfVisibleMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'NumberOfMessagesSent',
        'NumberOfMessagesReceived',
        'NumberOfMessagesDeleted'
    ]
    
    queue_name = queue_url.split('/')[-1]
    results = {}
    
    for metric in metrics:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName=metric,
            Dimensions=[
                {'Name': 'QueueName', 'Value': queue_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average', 'Maximum', 'Sum']
        )
        
        results[metric] = {
            'datapoints': response['Datapoints'],
            'average': sum(p['Average'] for p in response['Datapoints']) / len(response['Datapoints']) if response['Datapoints'] else 0,
            'maximum': max(p['Maximum'] for p in response['Datapoints']) if response['Datapoints'] else 0
        }
    
    return results

def diagnose_queue_issues(queue_url):
    """
    Diagnose common queue issues
    """
    issues = []
    metrics = get_queue_metrics(queue_url)
    
    # Check for message buildup
    if metrics['visible_messages'] > 10000:
        issues.append("High number of visible messages - consider scaling consumers")
    
    # Check for old messages
    if metrics['oldest_message_age'] > 3600:  # 1 hour
        issues.append("Old messages detected - check consumer performance")
    
    # Check for stuck messages
    if metrics['in_flight_messages'] > metrics['visible_messages']:
        issues.append("High number of in-flight messages - check visibility timeout")
    
    # Check queue attributes for configuration issues
    response = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['All']
    )
    
    attributes = response['Attributes']
    
    if int(attributes.get('VisibilityTimeoutSeconds', 0)) < 30:
        issues.append("Visibility timeout may be too short")
    
    if int(attributes.get('ReceiveMessageWaitTimeSeconds', 0)) == 0:
        issues.append("Long polling not enabled - consider enabling for cost savings")
    
    return {
        'metrics': metrics,
        'issues': issues,
        'recommendations': generate_recommendations(metrics, issues)
    }

def generate_recommendations(metrics, issues):
    """
    Generate performance recommendations
    """
    recommendations = []
    
    if metrics['visible_messages'] > 5000:
        recommendations.append("Scale up consumers or increase batch processing")
    
    if metrics['oldest_message_age'] > 1800:  # 30 minutes
        recommendations.append("Optimize message processing time or increase parallelism")
    
    if len(issues) == 0:
        recommendations.append("Queue performance looks healthy")
    
    return recommendations
```

## Security Best Practices

### 1. **Access Control**
```yaml
# Queue access policy
QueueAccessPolicy:
  Type: AWS::SQS::QueuePolicy
  Properties:
    Queues:
      - !Ref SecureQueue
    PolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            AWS: !GetAtt ProcessingRole.Arn
          Action:
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
            - sqs:ChangeMessageVisibility
          Resource: !GetAtt SecureQueue.Arn
        - Effect: Allow
          Principal:
            AWS: !GetAtt PublisherRole.Arn
          Action:
            - sqs:SendMessage
          Resource: !GetAtt SecureQueue.Arn
          Condition:
            StringEquals:
              'aws:SourceAccount': !Ref 'AWS::AccountId'
```

### 2. **Encryption**
```yaml
# KMS encrypted queue
EncryptedQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: encrypted-queue
    KmsMasterKeyId: !Ref SQSKMSKey
    KmsDataKeyReusePeriodSeconds: 300

SQSKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for SQS encryption
    KeyPolicy:
      Statement:
        - Effect: Allow
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
          Action: "kms:*"
          Resource: "*"
```

## Cost Optimization

### 1. **Right-sizing and Efficiency**
```python
def optimize_queue_costs(queue_url):
    """
    Analyze and optimize queue costs
    """
    # Analyze message patterns
    metrics = analyze_queue_performance(queue_url, duration_minutes=1440)  # 24 hours
    
    recommendations = []
    
    # Check polling efficiency
    sent = metrics['NumberOfMessagesSent']['average']
    received = metrics['NumberOfMessagesReceived']['average']
    
    if received > sent * 2:  # High receive-to-send ratio
        recommendations.append("Enable long polling to reduce API calls")
    
    # Check batch processing opportunities
    visible_messages = metrics['ApproximateNumberOfVisibleMessages']['average']
    
    if visible_messages > 100:
        recommendations.append("Consider batch processing to improve efficiency")
    
    # Estimate monthly costs
    monthly_requests = (sent + received) * 30 * 24 * 60 / 5  # Assuming 5-minute intervals
    monthly_cost = monthly_requests * 0.0000004  # $0.40 per million requests
    
    return {
        'current_monthly_cost_estimate': monthly_cost,
        'recommendations': recommendations,
        'metrics_summary': {
            'avg_sent_per_hour': sent,
            'avg_received_per_hour': received,
            'avg_visible_messages': visible_messages
        }
    }

def implement_long_polling(queue_url):
    """
    Enable long polling to reduce costs
    """
    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={
            'ReceiveMessageWaitTimeSeconds': '20'  # Maximum long polling duration
        }
    )
    
    print(f"Enabled long polling for queue: {queue_url}")
```

## Best Practices

### 1. **Message Design**
- Keep message payloads small and focused
- Include correlation IDs for tracing
- Use message attributes for metadata
- Implement idempotent processing

### 2. **Error Handling**
- Configure appropriate dead letter queues
- Implement exponential backoff for retries
- Monitor dead letter queues regularly
- Log failures for analysis

### 3. **Performance**
- Use batch operations when possible
- Enable long polling to reduce costs
- Right-size visibility timeouts
- Monitor queue metrics continuously

### 4. **Security**
- Use IAM roles instead of access keys
- Encrypt sensitive message content
- Implement least privilege access
- Use VPC endpoints for private access

## Additional Resources

- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/sqs/latest/dg/)
- [SQS Best Practices](https://docs.aws.amazon.com/sqs/latest/dg/sqs-best-practices.html)
- [SQS FIFO Queues](https://docs.aws.amazon.com/sqs/latest/dg/FIFO-queues.html)
- [SQS Dead Letter Queues](https://docs.aws.amazon.com/sqs/latest/dg/sqs-dead-letter-queues.html)