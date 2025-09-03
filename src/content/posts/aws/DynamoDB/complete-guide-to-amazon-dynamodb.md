---
author: Anubhav Gain
category: aws
description: Complete guide to Amazon DynamoDB - fast, flexible NoSQL database service with single-digit millisecond latency, automatic scaling, and serverless architecture.
draft: false
featured: true
lang: en
pubDatetime: '2024-08-20T13:00:00+05:30'
slug: complete-guide-to-amazon-dynamodb
tags:
- aws
- dynamodb
- nosql
- database
- serverless
- performance
- scaling
title: 'Complete Guide to Amazon DynamoDB: Serverless NoSQL at Scale'
---

# Complete Guide to Amazon DynamoDB: Serverless NoSQL at Scale

Amazon DynamoDB is a fully managed, serverless, key-value NoSQL database designed to run high-performance applications at any scale. DynamoDB offers built-in security, continuous backups, automated multi-Region replication, in-memory caching, and data import and export tools.

## Overview

DynamoDB provides fast and predictable performance with seamless scalability. You can create database tables that can store and retrieve any amount of data and serve any level of request traffic. DynamoDB automatically spreads your data and traffic for your tables over sufficient servers to handle your throughput and storage requirements.

## Key Benefits

### 1. **Performance and Scalability**
- Single-digit millisecond latency
- Handles 10 trillion requests per day
- Supports peaks of 20+ million requests per second
- Automatic scaling up and down

### 2. **Serverless**
- No servers to manage
- Pay only for what you use
- Automatic scaling with on-demand mode
- Built-in high availability

### 3. **Security and Reliability**
- Encryption at rest and in transit
- Fine-grained access control with IAM
- Point-in-time recovery
- Multi-Region replication

### 4. **Developer Productivity**
- Simple API operations
- Multiple data types supported
- Flexible schema
- Integration with AWS services

## Core Concepts

### 1. **Tables, Items, and Attributes**
```python
# Table structure example
{
    "TableName": "Users",
    "Items": [
        {
            "userId": {"S": "user123"},          # String
            "email": {"S": "user@example.com"},
            "age": {"N": "30"},                  # Number
            "preferences": {                     # Map
                "M": {
                    "theme": {"S": "dark"},
                    "notifications": {"BOOL": True}
                }
            },
            "tags": {"SS": ["premium", "beta"]}, # String Set
            "loginHistory": {                    # List
                "L": [
                    {"S": "2024-01-01T10:00:00Z"},
                    {"S": "2024-01-02T14:30:00Z"}
                ]
            }
        }
    ]
}
```

### 2. **Primary Keys**
```yaml
# Single Primary Key (Partition Key)
UserTable:
  Type: AWS::DynamoDB::Table
  Properties:
    AttributeDefinitions:
      - AttributeName: userId
        AttributeType: S
    KeySchema:
      - AttributeName: userId
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST

# Composite Primary Key (Partition Key + Sort Key)
OrderTable:
  Type: AWS::DynamoDB::Table
  Properties:
    AttributeDefinitions:
      - AttributeName: customerId
        AttributeType: S
      - AttributeName: orderDate
        AttributeType: S
    KeySchema:
      - AttributeName: customerId
        KeyType: HASH
      - AttributeName: orderDate
        KeyType: RANGE
    BillingMode: PAY_PER_REQUEST
```

### 3. **Secondary Indexes**
```yaml
# Global Secondary Index (GSI)
ProductTable:
  Type: AWS::DynamoDB::Table
  Properties:
    AttributeDefinitions:
      - AttributeName: productId
        AttributeType: S
      - AttributeName: category
        AttributeType: S
      - AttributeName: price
        AttributeType: N
      - AttributeName: brand
        AttributeType: S
    KeySchema:
      - AttributeName: productId
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: CategoryIndex
        KeySchema:
          - AttributeName: category
            KeyType: HASH
          - AttributeName: price
            KeyType: RANGE
        Projection:
          ProjectionType: ALL
        BillingMode: PAY_PER_REQUEST
      - IndexName: BrandIndex
        KeySchema:
          - AttributeName: brand
            KeyType: HASH
        Projection:
          ProjectionType: KEYS_ONLY
        BillingMode: PAY_PER_REQUEST

# Local Secondary Index (LSI)
GameScoreTable:
  Type: AWS::DynamoDB::Table
  Properties:
    AttributeDefinitions:
      - AttributeName: userId
        AttributeType: S
      - AttributeName: gameTitle
        AttributeType: S
      - AttributeName: topScore
        AttributeType: N
    KeySchema:
      - AttributeName: userId
        KeyType: HASH
      - AttributeName: gameTitle
        KeyType: RANGE
    LocalSecondaryIndexes:
      - IndexName: TopScoreIndex
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
          - AttributeName: topScore
            KeyType: RANGE
        Projection:
          ProjectionType: ALL
```

## Basic Operations

### 1. **CRUD Operations**
```python
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

# CREATE - Put Item
def create_user(user_id, email, name):
    try:
        response = table.put_item(
            Item={
                'userId': user_id,
                'email': email,
                'name': name,
                'createdAt': datetime.utcnow().isoformat(),
                'status': 'active'
            },
            ConditionExpression='attribute_not_exists(userId)'  # Prevent overwrites
        )
        return response
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            print("User already exists")
        raise e

# READ - Get Item
def get_user(user_id):
    try:
        response = table.get_item(
            Key={'userId': user_id},
            ProjectionExpression='userId, email, #name, #status',  # Only specific attributes
            ExpressionAttributeNames={
                '#name': 'name',    # Reserved keyword workaround
                '#status': 'status'
            }
        )
        return response.get('Item')
    except ClientError as e:
        print(f"Error getting user: {e}")
        raise e

# UPDATE - Update Item
def update_user(user_id, email=None, status=None):
    update_expression = "SET updatedAt = :timestamp"
    expression_values = {':timestamp': datetime.utcnow().isoformat()}
    
    if email:
        update_expression += ", email = :email"
        expression_values[':email'] = email
    
    if status:
        update_expression += ", #status = :status"
        expression_values[':status'] = status
        
    try:
        response = table.update_item(
            Key={'userId': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames={'#status': 'status'},
            ConditionExpression='attribute_exists(userId)',  # Only update if exists
            ReturnValues='ALL_NEW'
        )
        return response['Attributes']
    except ClientError as e:
        print(f"Error updating user: {e}")
        raise e

# DELETE - Delete Item
def delete_user(user_id):
    try:
        response = table.delete_item(
            Key={'userId': user_id},
            ConditionExpression='attribute_exists(userId)',
            ReturnValues='ALL_OLD'
        )
        return response.get('Attributes')
    except ClientError as e:
        print(f"Error deleting user: {e}")
        raise e
```

### 2. **Query Operations**
```python
from boto3.dynamodb.conditions import Key, Attr

# Query with partition key
def get_user_orders(customer_id):
    response = table.query(
        KeyConditionExpression=Key('customerId').eq(customer_id)
    )
    return response['Items']

# Query with partition key and sort key range
def get_orders_by_date_range(customer_id, start_date, end_date):
    response = table.query(
        KeyConditionExpression=
            Key('customerId').eq(customer_id) &
            Key('orderDate').between(start_date, end_date),
        ScanIndexForward=False,  # Sort in descending order
        Limit=20
    )
    return response['Items']

# Query with Global Secondary Index
def get_products_by_category(category, min_price=None):
    key_condition = Key('category').eq(category)
    
    if min_price:
        key_condition &= Key('price').gte(min_price)
    
    response = table.query(
        IndexName='CategoryIndex',
        KeyConditionExpression=key_condition,
        ProjectionExpression='productId, #name, price, description',
        ExpressionAttributeNames={'#name': 'name'}
    )
    return response['Items']

# Query with filter expression
def get_active_premium_users(user_type):
    response = table.query(
        IndexName='UserTypeIndex',
        KeyConditionExpression=Key('userType').eq(user_type),
        FilterExpression=
            Attr('status').eq('active') &
            Attr('subscription').eq('premium') &
            Attr('lastLoginDate').gte('2024-01-01'),
        ProjectionExpression='userId, email, lastLoginDate'
    )
    return response['Items']
```

### 3. **Scan Operations**
```python
# Basic scan
def scan_all_users():
    response = table.scan(
        ProjectionExpression='userId, email, #name',
        ExpressionAttributeNames={'#name': 'name'},
        FilterExpression=Attr('status').eq('active')
    )
    return response['Items']

# Parallel scan for large tables
def parallel_scan_users(total_segments=4):
    all_items = []
    
    for segment in range(total_segments):
        response = table.scan(
            Select='ALL_ATTRIBUTES',
            TotalSegments=total_segments,
            Segment=segment,
            FilterExpression=Attr('status').eq('active')
        )
        all_items.extend(response['Items'])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                Select='ALL_ATTRIBUTES',
                TotalSegments=total_segments,
                Segment=segment,
                ExclusiveStartKey=response['LastEvaluatedKey'],
                FilterExpression=Attr('status').eq('active')
            )
            all_items.extend(response['Items'])
    
    return all_items
```

## Advanced Features

### 1. **Transactions**
```python
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')

def transfer_funds(from_account, to_account, amount):
    try:
        # Transactional write
        response = dynamodb.meta.client.transact_write_items(
            TransactItems=[
                {
                    'Update': {
                        'TableName': 'Accounts',
                        'Key': {'accountId': {'S': from_account}},
                        'UpdateExpression': 'SET balance = balance - :amount',
                        'ConditionExpression': 'balance >= :amount',
                        'ExpressionAttributeValues': {
                            ':amount': {'N': str(amount)}
                        }
                    }
                },
                {
                    'Update': {
                        'TableName': 'Accounts',
                        'Key': {'accountId': {'S': to_account}},
                        'UpdateExpression': 'SET balance = balance + :amount',
                        'ExpressionAttributeValues': {
                            ':amount': {'N': str(amount)}
                        }
                    }
                },
                {
                    'Put': {
                        'TableName': 'Transactions',
                        'Item': {
                            'transactionId': {'S': str(uuid.uuid4())},
                            'fromAccount': {'S': from_account},
                            'toAccount': {'S': to_account},
                            'amount': {'N': str(amount)},
                            'timestamp': {'S': datetime.utcnow().isoformat()}
                        }
                    }
                }
            ]
        )
        return {'status': 'success', 'transactionId': response['ItemCollectionMetrics']}
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'TransactionCanceledException':
            return {'status': 'failed', 'reason': 'Insufficient funds or account not found'}
        raise e

def read_transaction_details(transaction_id, account_id):
    try:
        # Transactional read
        response = dynamodb.meta.client.transact_get_items(
            TransactItems=[
                {
                    'Get': {
                        'TableName': 'Transactions',
                        'Key': {'transactionId': {'S': transaction_id}}
                    }
                },
                {
                    'Get': {
                        'TableName': 'Accounts',
                        'Key': {'accountId': {'S': account_id}},
                        'ProjectionExpression': 'accountId, balance, #status',
                        'ExpressionAttributeNames': {'#status': 'status'}
                    }
                }
            ]
        )
        
        return {
            'transaction': response['Responses'][0].get('Item'),
            'account': response['Responses'][1].get('Item')
        }
        
    except ClientError as e:
        print(f"Error reading transaction details: {e}")
        raise e
```

### 2. **Batch Operations**
```python
# Batch write (put/delete multiple items)
def batch_create_users(users):
    table = dynamodb.Table('Users')
    
    with table.batch_writer() as batch:
        for user in users:
            batch.put_item(Item=user)
    
    return {'status': 'success', 'count': len(users)}

# Batch get multiple items
def batch_get_users(user_ids):
    response = dynamodb.batch_get_item(
        RequestItems={
            'Users': {
                'Keys': [{'userId': user_id} for user_id in user_ids],
                'ProjectionExpression': 'userId, email, #name',
                'ExpressionAttributeNames': {'#name': 'name'}
            }
        }
    )
    
    users = response['Responses']['Users']
    
    # Handle unprocessed keys
    while response.get('UnprocessedKeys'):
        response = dynamodb.batch_get_item(
            RequestItems=response['UnprocessedKeys']
        )
        users.extend(response['Responses']['Users'])
    
    return users
```

### 3. **DynamoDB Streams**
```python
# Lambda function to process DynamoDB stream
import json

def lambda_handler(event, context):
    for record in event['Records']:
        event_name = record['eventName']
        
        if event_name == 'INSERT':
            handle_new_item(record['dynamodb']['NewImage'])
        elif event_name == 'MODIFY':
            handle_item_update(
                record['dynamodb']['OldImage'],
                record['dynamodb']['NewImage']
            )
        elif event_name == 'REMOVE':
            handle_item_deletion(record['dynamodb']['OldImage'])
    
    return {'statusCode': 200}

def handle_new_item(new_image):
    # Process new item creation
    user_id = new_image['userId']['S']
    print(f"New user created: {user_id}")
    
    # Send welcome email, create related records, etc.
    send_welcome_email(user_id)

def handle_item_update(old_image, new_image):
    # Process item updates
    user_id = new_image['userId']['S']
    
    # Check what changed
    if old_image.get('email', {}).get('S') != new_image.get('email', {}).get('S'):
        print(f"User {user_id} changed email")
        # Handle email change logic

def handle_item_deletion(old_image):
    # Process item deletion
    user_id = old_image['userId']['S']
    print(f"User deleted: {user_id}")
    
    # Cleanup related data, send farewell email, etc.
```

## Performance Optimization

### 1. **Capacity Planning**
```yaml
# Provisioned mode with auto scaling
Table:
  Type: AWS::DynamoDB::Table
  Properties:
    BillingMode: PROVISIONED
    ProvisionedThroughput:
      ReadCapacityUnits: 5
      WriteCapacityUnits: 5
    GlobalSecondaryIndexes:
      - IndexName: GSI1
        ProvisionedThroughput:
          ReadCapacityUnits: 5
          WriteCapacityUnits: 5

# Auto scaling configuration
ReadCapacityScalableTarget:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    ServiceNamespace: dynamodb
    ResourceId: !Sub "table/${Table}"
    ScalableDimension: dynamodb:table:ReadCapacityUnits
    MinCapacity: 1
    MaxCapacity: 100

ReadScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    ServiceNamespace: dynamodb
    ResourceId: !Sub "table/${Table}"
    ScalableDimension: dynamodb:table:ReadCapacityUnits
    PolicyName: ReadAutoScalingPolicy
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 70.0
      PredefinedMetricSpecification:
        PredefinedMetricType: DynamoDBReadCapacityUtilization
```

### 2. **Hot Partition Prevention**
```python
import hashlib
import uuid

# Use compound keys to distribute data
def generate_distributed_key(user_id, timestamp):
    # Add random suffix to partition key
    hash_suffix = hashlib.md5(f"{user_id}{timestamp}".encode()).hexdigest()[:4]
    return f"{user_id}#{hash_suffix}"

# Use write sharding for high-frequency counters
def increment_counter(counter_name, increment=1):
    shard_id = random.randint(0, 9)  # 10 shards
    shard_key = f"{counter_name}#{shard_id}"
    
    table.update_item(
        Key={'counterId': shard_key},
        UpdateExpression='ADD counterValue :inc',
        ExpressionAttributeValues={':inc': increment}
    )

def get_counter_total(counter_name):
    # Sum all shards
    total = 0
    for shard_id in range(10):
        shard_key = f"{counter_name}#{shard_id}"
        response = table.get_item(Key={'counterId': shard_key})
        if 'Item' in response:
            total += response['Item'].get('counterValue', 0)
    return total
```

### 3. **DynamoDB Accelerator (DAX)**
```yaml
# DAX cluster for microsecond latency
DAXCluster:
  Type: AWS::DAX::Cluster
  Properties:
    ClusterName: my-dax-cluster
    IAMRoleArn: !GetAtt DAXServiceRole.Arn
    NodeType: dax.r4.large
    ReplicationFactor: 3
    SubnetGroupName: !Ref DAXSubnetGroup
    SecurityGroupIds:
      - !Ref DAXSecurityGroup

DAXSubnetGroup:
  Type: AWS::DAX::SubnetGroup
  Properties:
    SubnetGroupName: dax-subnet-group
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
```

```python
# Using DAX client
import boto3

# Regular DynamoDB client
dynamodb = boto3.resource('dynamodb')

# DAX client for caching
import amazondax
dax = amazondax.AmazonDaxClient.resource(endpoint_url='dax://my-dax-cluster.region.dax.amazonaws.com:8111')

def get_user_with_cache(user_id):
    # Try DAX first (microsecond latency)
    try:
        table = dax.Table('Users')
        response = table.get_item(Key={'userId': user_id})
        return response.get('Item')
    except Exception as e:
        print(f"DAX error, falling back to DynamoDB: {e}")
        # Fallback to regular DynamoDB
        table = dynamodb.Table('Users')
        response = table.get_item(Key={'userId': user_id})
        return response.get('Item')
```

## Security Best Practices

### 1. **IAM Policies and Roles**
```yaml
# Fine-grained access control
DynamoDBRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: lambda.amazonaws.com
          Action: sts:AssumeRole
    Policies:
      - PolicyName: DynamoDBAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - dynamodb:GetItem
                - dynamodb:PutItem
                - dynamodb:UpdateItem
                - dynamodb:DeleteItem
              Resource: !Sub "${UserTable}/index/*"
              Condition:
                ForAllValues:StringEquals:
                  dynamodb:LeadingKeys:
                    - "${aws:userid}"
```

### 2. **Encryption**
```yaml
# Encryption at rest
EncryptedTable:
  Type: AWS::DynamoDB::Table
  Properties:
    SSESpecification:
      SSEEnabled: true
      KMSMasterKeyId: !Ref DynamoDBKMSKey

# Customer managed KMS key
DynamoDBKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for DynamoDB encryption
    KeyPolicy:
      Statement:
        - Effect: Allow
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
          Action: "kms:*"
          Resource: "*"
```

### 3. **VPC Endpoints**
```yaml
# VPC endpoint for private access
DynamoDBVPCEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcId: !Ref VPC
    ServiceName: !Sub "com.amazonaws.${AWS::Region}.dynamodb"
    VpcEndpointType: Gateway
    RouteTableIds:
      - !Ref PrivateRouteTable
```

## Monitoring and Troubleshooting

### 1. **CloudWatch Metrics and Alarms**
```yaml
# High read throttle alarm
ReadThrottleAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: DynamoDB-ReadThrottles
    AlarmDescription: DynamoDB read throttles detected
    MetricName: ReadThrottleEvents
    Namespace: AWS/DynamoDB
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 0
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: TableName
        Value: !Ref UserTable

# Custom metrics
def put_custom_metrics(table_name, operation, latency, success):
    cloudwatch = boto3.client('cloudwatch')
    
    cloudwatch.put_metric_data(
        Namespace='DynamoDB/Application',
        MetricData=[
            {
                'MetricName': 'OperationLatency',
                'Value': latency,
                'Unit': 'Milliseconds',
                'Dimensions': [
                    {'Name': 'TableName', 'Value': table_name},
                    {'Name': 'Operation', 'Value': operation}
                ]
            },
            {
                'MetricName': 'OperationSuccess',
                'Value': 1 if success else 0,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'TableName', 'Value': table_name},
                    {'Name': 'Operation', 'Value': operation}
                ]
            }
        ]
    )
```

### 2. **Error Handling and Retry Logic**
```python
import boto3
from botocore.exceptions import ClientError
import time
import random

def resilient_dynamodb_operation(operation_func, max_retries=3):
    """
    Wrapper for DynamoDB operations with exponential backoff retry logic
    """
    for attempt in range(max_retries + 1):
        try:
            return operation_func()
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            # Don't retry these errors
            if error_code in ['ValidationException', 'ResourceNotFoundException']:
                raise e
            
            # Retry these errors with backoff
            if error_code in ['ProvisionedThroughputExceededException', 'ThrottlingException']:
                if attempt < max_retries:
                    # Exponential backoff with jitter
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(wait_time)
                    continue
                else:
                    raise e
            
            # For other errors, raise immediately
            raise e
    
    raise Exception("Max retries exceeded")

# Usage example
def safe_get_item(table, key):
    def operation():
        return table.get_item(Key=key)
    
    return resilient_dynamodb_operation(operation)
```

## Common Patterns and Use Cases

### 1. **Time Series Data**
```python
# Efficient time series storage pattern
def store_time_series_data(metric_name, timestamp, value, attributes=None):
    # Use reverse timestamp for recent-first ordering
    reverse_timestamp = str(9999999999 - int(timestamp))
    
    item = {
        'metricName': metric_name,
        'reverseTimestamp': reverse_timestamp,
        'timestamp': timestamp,
        'value': value,
        'ttl': int(timestamp) + (30 * 24 * 60 * 60)  # 30 days TTL
    }
    
    if attributes:
        item.update(attributes)
    
    table.put_item(Item=item)

def get_recent_metrics(metric_name, limit=100):
    response = table.query(
        KeyConditionExpression=Key('metricName').eq(metric_name),
        ScanIndexForward=True,  # Recent first due to reverse timestamp
        Limit=limit
    )
    return response['Items']
```

### 2. **Leaderboard Pattern**
```python
# Gaming leaderboard with efficient queries
def update_player_score(player_id, game_id, score):
    # Update player's best score
    table.update_item(
        Key={
            'playerId': player_id,
            'gameId': game_id
        },
        UpdateExpression='SET bestScore = if_not_exists(bestScore, :zero), bestScore = if_(:score > bestScore, :score, bestScore)',
        ExpressionAttributeValues={
            ':score': score,
            ':zero': 0
        }
    )
    
    # Also store in GSI optimized for leaderboard queries
    table.put_item(
        Item={
            'pk': f"LEADERBOARD#{game_id}",
            'sk': f"{str(999999999 - score).zfill(10)}#{player_id}",  # Reverse score for top-first ordering
            'playerId': player_id,
            'gameId': game_id,
            'score': score,
            'timestamp': datetime.utcnow().isoformat()
        }
    )

def get_leaderboard(game_id, limit=10):
    response = table.query(
        IndexName='LeaderboardIndex',
        KeyConditionExpression=Key('pk').eq(f"LEADERBOARD#{game_id}"),
        ScanIndexForward=True,
        Limit=limit
    )
    return response['Items']
```

### 3. **Multi-Tenant SaaS Pattern**
```python
# Efficient multi-tenant data isolation
def create_tenant_item(tenant_id, item_type, item_id, data):
    item = {
        'pk': f"TENANT#{tenant_id}",
        'sk': f"{item_type}#{item_id}",
        'tenantId': tenant_id,
        'itemType': item_type,
        'itemId': item_id,
        'data': data,
        'createdAt': datetime.utcnow().isoformat()
    }
    
    table.put_item(Item=item)

def get_tenant_items(tenant_id, item_type=None):
    key_condition = Key('pk').eq(f"TENANT#{tenant_id}")
    
    if item_type:
        key_condition &= Key('sk').begins_with(f"{item_type}#")
    
    response = table.query(KeyConditionExpression=key_condition)
    return response['Items']
```

## Additional Resources

- [Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/latest/developerguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/dynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Data Modeling Guide](https://docs.aws.amazon.com/dynamodb/latest/developerguide/bp-modeling-nosql.html)
- [AWS DynamoDB Examples](https://github.com/aws-samples/aws-dynamodb-examples)