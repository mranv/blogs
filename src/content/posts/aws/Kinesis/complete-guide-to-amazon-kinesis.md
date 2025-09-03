---
title: "The Complete Guide to Amazon Kinesis: Real-time Data Streaming and Analytics"
description: "Master Amazon Kinesis with this comprehensive guide covering data streams, analytics, firehose delivery, and real-time processing architectures."
publishDate: 2024-12-09
author: "Anubhav Gain"
category: "Cloud Computing"
tags:
  - aws
  - kinesis
  - streaming
  - real-time
  - analytics
  - big-data
  - data-processing
  - lambda
  - firehose
featured: true
draft: false
slug: "complete-guide-amazon-kinesis-streaming"
---

# The Complete Guide to Amazon Kinesis: Real-time Data Streaming and Analytics

Amazon Kinesis is AWS's platform for streaming data on AWS, offering powerful services for real-time data ingestion, processing, and analytics. This comprehensive guide covers all Kinesis services and advanced streaming architectures.

## Table of Contents
1. [Introduction to Kinesis](#introduction)
2. [Kinesis Services Overview](#services-overview)
3. [Kinesis Data Streams](#data-streams)
4. [Kinesis Data Firehose](#data-firehose)
5. [Kinesis Data Analytics](#data-analytics)
6. [Kinesis Video Streams](#video-streams)
7. [Producer and Consumer Patterns](#producer-consumer)
8. [Real-time Processing Architectures](#processing-architectures)
9. [Integration Patterns](#integration-patterns)
10. [Monitoring and Operations](#monitoring-operations)
11. [Best Practices](#best-practices)
12. [Cost Optimization](#cost-optimization)
13. [Troubleshooting](#troubleshooting)

## Introduction to Kinesis {#introduction}

Amazon Kinesis is a platform for streaming data on AWS that makes it easy to collect, process, and analyze real-time, streaming data. It enables you to get timely insights and react quickly to new information.

### Key Benefits:
- **Real-time Processing**: Process data as it arrives
- **Fully Managed**: No infrastructure to manage
- **Scalable**: Handle any amount of streaming data
- **Cost-effective**: Pay only for what you use
- **Integrated**: Works with other AWS services

### Use Cases:
- Real-time analytics and dashboards
- Log and event data collection
- IoT data ingestion
- Clickstream analysis
- Machine learning inference
- Video streaming and processing

## Kinesis Services Overview {#services-overview}

```python
import boto3
import json
from datetime import datetime

def kinesis_services_overview():
    """
    Overview of Kinesis services and their use cases
    """
    services = {
        "kinesis_data_streams": {
            "description": "Real-time data streaming service",
            "use_cases": [
                "Real-time data processing",
                "Log aggregation", 
                "IoT data ingestion",
                "Clickstream processing"
            ],
            "key_features": [
                "Multiple producers and consumers",
                "Configurable retention period (1-365 days)",
                "Automatic scaling with on-demand mode",
                "Integration with Lambda, KDF, KDA"
            ]
        },
        "kinesis_data_firehose": {
            "description": "Data delivery service to AWS data stores",
            "use_cases": [
                "Data lake ingestion",
                "Data warehouse loading",
                "Log delivery to S3",
                "Real-time ETL"
            ],
            "key_features": [
                "Serverless and fully managed",
                "Built-in data transformation",
                "Compression and format conversion",
                "Direct delivery to S3, Redshift, OpenSearch"
            ]
        },
        "kinesis_data_analytics": {
            "description": "Real-time analytics with SQL or Apache Flink",
            "use_cases": [
                "Real-time dashboards",
                "Anomaly detection",
                "Real-time recommendations",
                "Complex event processing"
            ],
            "key_features": [
                "Standard SQL for stream processing",
                "Apache Flink for advanced analytics",
                "Built-in windowing functions",
                "Machine learning integration"
            ]
        },
        "kinesis_video_streams": {
            "description": "Video streaming service for analytics and ML",
            "use_cases": [
                "Security camera streams",
                "Smart home devices",
                "Industrial IoT video",
                "Live video processing"
            ],
            "key_features": [
                "Secure video ingestion",
                "WebRTC support",
                "Integration with ML services",
                "HLS streaming support"
            ]
        }
    }
    
    return services

print("Amazon Kinesis Services Overview:")
print(json.dumps(kinesis_services_overview(), indent=2))
```

## Kinesis Data Streams {#data-streams}

### Creating and Managing Data Streams

```python
class KinesisDataStreamManager:
    def __init__(self):
        self.kinesis = boto3.client('kinesis')
        self.cloudwatch = boto3.client('cloudwatch')
    
    def create_stream(self, stream_name, shard_count=1, mode='PROVISIONED'):
        """
        Create a Kinesis Data Stream
        """
        try:
            if mode == 'PROVISIONED':
                response = self.kinesis.create_stream(
                    StreamName=stream_name,
                    ShardCount=shard_count
                )
            else:  # ON_DEMAND mode
                response = self.kinesis.create_stream(
                    StreamName=stream_name,
                    StreamModeDetails={
                        'StreamMode': 'ON_DEMAND'
                    }
                )
            
            print(f"Stream '{stream_name}' creation initiated")
            
            # Wait for stream to become active
            self.wait_for_stream_active(stream_name)
            
            return response
            
        except Exception as e:
            print(f"Error creating stream: {e}")
            return None
    
    def wait_for_stream_active(self, stream_name, timeout=300):
        """
        Wait for stream to become active
        """
        import time
        
        print(f"Waiting for stream '{stream_name}' to become active...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = self.kinesis.describe_stream(StreamName=stream_name)
                status = response['StreamDescription']['StreamStatus']
                
                if status == 'ACTIVE':
                    print(f"Stream '{stream_name}' is now active!")
                    return True
                elif status in ['DELETING', 'FAILED']:
                    print(f"Stream '{stream_name}' is in {status} state")
                    return False
                else:
                    print(f"Stream status: {status}")
                    time.sleep(10)
                    
            except Exception as e:
                print(f"Error checking stream status: {e}")
                time.sleep(10)
        
        print(f"Timeout waiting for stream '{stream_name}' to become active")
        return False
    
    def put_record(self, stream_name, data, partition_key):
        """
        Put a single record to the stream
        """
        try:
            response = self.kinesis.put_record(
                StreamName=stream_name,
                Data=json.dumps(data) if isinstance(data, dict) else data,
                PartitionKey=partition_key
            )
            
            return {
                'shard_id': response['ShardId'],
                'sequence_number': response['SequenceNumber']
            }
            
        except Exception as e:
            print(f"Error putting record: {e}")
            return None
    
    def put_records_batch(self, stream_name, records):
        """
        Put multiple records in a batch
        """
        try:
            kinesis_records = []
            for record in records:
                kinesis_records.append({
                    'Data': json.dumps(record['data']) if isinstance(record['data'], dict) else record['data'],
                    'PartitionKey': record['partition_key']
                })
            
            response = self.kinesis.put_records(
                Records=kinesis_records,
                StreamName=stream_name
            )
            
            # Check for failed records
            failed_records = []
            for i, record_result in enumerate(response['Records']):
                if 'ErrorCode' in record_result:
                    failed_records.append({
                        'index': i,
                        'error_code': record_result['ErrorCode'],
                        'error_message': record_result['ErrorMessage']
                    })
            
            result = {
                'failed_record_count': response['FailedRecordCount'],
                'successful_records': len(kinesis_records) - response['FailedRecordCount'],
                'failed_records': failed_records
            }
            
            return result
            
        except Exception as e:
            print(f"Error putting records batch: {e}")
            return None
    
    def get_records(self, stream_name, shard_iterator_type='TRIM_HORIZON', sequence_number=None):
        """
        Get records from stream
        """
        try:
            # Get stream description to find shards
            stream_desc = self.kinesis.describe_stream(StreamName=stream_name)
            shards = stream_desc['StreamDescription']['Shards']
            
            all_records = []
            
            for shard in shards:
                shard_id = shard['ShardId']
                
                # Get shard iterator
                iterator_request = {
                    'StreamName': stream_name,
                    'ShardId': shard_id,
                    'ShardIteratorType': shard_iterator_type
                }
                
                if sequence_number:
                    iterator_request['StartingSequenceNumber'] = sequence_number
                
                iterator_response = self.kinesis.get_shard_iterator(**iterator_request)
                shard_iterator = iterator_response['ShardIterator']
                
                # Get records
                if shard_iterator:
                    records_response = self.kinesis.get_records(ShardIterator=shard_iterator)
                    
                    for record in records_response['Records']:
                        all_records.append({
                            'sequence_number': record['SequenceNumber'],
                            'partition_key': record['PartitionKey'],
                            'data': record['Data'].decode('utf-8'),
                            'approximate_arrival_timestamp': record['ApproximateArrivalTimestamp'],
                            'shard_id': shard_id
                        })
            
            return all_records
            
        except Exception as e:
            print(f"Error getting records: {e}")
            return []
    
    def update_shard_count(self, stream_name, target_shard_count):
        """
        Update shard count for provisioned stream
        """
        try:
            response = self.kinesis.update_shard_count(
                StreamName=stream_name,
                TargetShardCount=target_shard_count,
                ScalingType='UNIFORM_SCALING'
            )
            
            print(f"Stream '{stream_name}' shard count update initiated")
            return response
            
        except Exception as e:
            print(f"Error updating shard count: {e}")
            return None
    
    def get_stream_metrics(self, stream_name):
        """
        Get stream metrics from CloudWatch
        """
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=1)
            
            metrics = {}
            
            # Get incoming records metric
            incoming_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Kinesis',
                MetricName='IncomingRecords',
                Dimensions=[
                    {
                        'Name': 'StreamName',
                        'Value': stream_name
                    }
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Sum']
            )
            
            metrics['incoming_records'] = incoming_response['Datapoints']
            
            # Get incoming bytes metric
            bytes_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Kinesis',
                MetricName='IncomingBytes',
                Dimensions=[
                    {
                        'Name': 'StreamName',
                        'Value': stream_name
                    }
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Sum']
            )
            
            metrics['incoming_bytes'] = bytes_response['Datapoints']
            
            return metrics
            
        except Exception as e:
            print(f"Error getting stream metrics: {e}")
            return {}

# Usage examples
stream_manager = KinesisDataStreamManager()

# Create a stream
stream_manager.create_stream('my-data-stream', shard_count=2)

# Put single record
record_result = stream_manager.put_record(
    'my-data-stream',
    {
        'user_id': 'user123',
        'event_type': 'click',
        'timestamp': datetime.utcnow().isoformat(),
        'page': 'homepage'
    },
    'user123'
)

print(f"Record put result: {record_result}")

# Put batch records
batch_records = [
    {
        'data': {
            'user_id': 'user124',
            'event_type': 'view',
            'timestamp': datetime.utcnow().isoformat(),
            'page': 'product'
        },
        'partition_key': 'user124'
    },
    {
        'data': {
            'user_id': 'user125',
            'event_type': 'purchase',
            'timestamp': datetime.utcnow().isoformat(),
            'amount': 99.99
        },
        'partition_key': 'user125'
    }
]

batch_result = stream_manager.put_records_batch('my-data-stream', batch_records)
print(f"Batch put result: {batch_result}")

# Get records
records = stream_manager.get_records('my-data-stream')
print(f"Retrieved {len(records)} records")

# Get stream metrics
metrics = stream_manager.get_stream_metrics('my-data-stream')
print(f"Stream metrics: {metrics}")
```

### Kinesis Producer Library (KPL) Integration

```python
import threading
import time
import random
from datetime import datetime

class KinesisProducer:
    def __init__(self, stream_name, region='us-east-1'):
        self.stream_name = stream_name
        self.kinesis = boto3.client('kinesis', region_name=region)
        self.buffer = []
        self.buffer_lock = threading.Lock()
        self.flush_interval = 5  # seconds
        self.max_buffer_size = 100
        self.running = False
    
    def start(self):
        """
        Start the producer with background flushing
        """
        self.running = True
        self.flush_thread = threading.Thread(target=self._flush_periodically)
        self.flush_thread.daemon = True
        self.flush_thread.start()
    
    def stop(self):
        """
        Stop the producer and flush remaining records
        """
        self.running = False
        if hasattr(self, 'flush_thread'):
            self.flush_thread.join()
        self._flush_buffer()
    
    def put_record_async(self, data, partition_key):
        """
        Add record to buffer for asynchronous processing
        """
        record = {
            'data': data,
            'partition_key': partition_key,
            'timestamp': datetime.utcnow()
        }
        
        with self.buffer_lock:
            self.buffer.append(record)
            
            # Flush if buffer is full
            if len(self.buffer) >= self.max_buffer_size:
                self._flush_buffer()
    
    def _flush_periodically(self):
        """
        Flush buffer periodically
        """
        while self.running:
            time.sleep(self.flush_interval)
            if self.buffer:
                self._flush_buffer()
    
    def _flush_buffer(self):
        """
        Flush buffer to Kinesis
        """
        with self.buffer_lock:
            if not self.buffer:
                return
            
            records_to_flush = self.buffer.copy()
            self.buffer.clear()
        
        # Convert to Kinesis records format
        kinesis_records = []
        for record in records_to_flush:
            kinesis_records.append({
                'Data': json.dumps(record['data']) if isinstance(record['data'], dict) else record['data'],
                'PartitionKey': record['partition_key']
            })
        
        try:
            response = self.kinesis.put_records(
                Records=kinesis_records,
                StreamName=self.stream_name
            )
            
            print(f"Flushed {len(kinesis_records)} records, "
                  f"Failed: {response['FailedRecordCount']}")
            
            # Handle failed records
            if response['FailedRecordCount'] > 0:
                self._handle_failed_records(kinesis_records, response['Records'])
                
        except Exception as e:
            print(f"Error flushing buffer: {e}")
            # Re-add records to buffer for retry
            with self.buffer_lock:
                self.buffer.extend(records_to_flush)
    
    def _handle_failed_records(self, original_records, response_records):
        """
        Handle failed records with retry logic
        """
        failed_records = []
        
        for i, response_record in enumerate(response_records):
            if 'ErrorCode' in response_record:
                failed_records.append(original_records[i])
                print(f"Failed record {i}: {response_record['ErrorCode']}")
        
        # Implement retry logic here
        if failed_records:
            print(f"Retrying {len(failed_records)} failed records...")
            # Simple retry - add back to buffer
            with self.buffer_lock:
                self.buffer.extend([
                    {
                        'data': json.loads(record['Data']),
                        'partition_key': record['PartitionKey'],
                        'timestamp': datetime.utcnow()
                    }
                    for record in failed_records
                ])

# Enhanced producer with aggregation
class AggregatingKinesisProducer(KinesisProducer):
    def __init__(self, stream_name, region='us-east-1'):
        super().__init__(stream_name, region)
        self.aggregation_enabled = True
        self.max_aggregated_size = 1024 * 1024  # 1MB
    
    def put_user_record(self, data, explicit_hash_key=None, partition_key=None):
        """
        Put user record with KPL-style aggregation
        """
        if not partition_key:
            partition_key = str(random.randint(0, 999999))
        
        record = {
            'data': data,
            'partition_key': partition_key,
            'explicit_hash_key': explicit_hash_key,
            'timestamp': datetime.utcnow()
        }
        
        if self.aggregation_enabled:
            self._add_to_aggregated_record(record)
        else:
            self.put_record_async(data, partition_key)
    
    def _add_to_aggregated_record(self, record):
        """
        Add record to aggregated record (simplified KPL aggregation)
        """
        # In real KPL implementation, this would use protobuf aggregation
        # This is a simplified version
        
        aggregated_data = {
            'records': [record],
            'aggregated': True,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.put_record_async(aggregated_data, record['partition_key'])

# Usage example
producer = AggregatingKinesisProducer('my-data-stream')
producer.start()

# Simulate real-time data ingestion
for i in range(1000):
    event_data = {
        'event_id': f'event_{i}',
        'user_id': f'user_{random.randint(1, 100)}',
        'event_type': random.choice(['click', 'view', 'purchase', 'scroll']),
        'timestamp': datetime.utcnow().isoformat(),
        'metadata': {
            'session_id': f'session_{random.randint(1, 20)}',
            'page': random.choice(['home', 'product', 'checkout', 'profile']),
            'device': random.choice(['mobile', 'desktop', 'tablet'])
        }
    }
    
    producer.put_user_record(event_data, partition_key=event_data['user_id'])
    
    # Simulate realistic timing
    time.sleep(0.01)

# Stop producer
producer.stop()
print("Producer stopped")
```

## Kinesis Data Firehose {#data-firehose}

### Setting up Data Delivery Streams

```python
class KinesisFirehoseManager:
    def __init__(self):
        self.firehose = boto3.client('firehose')
        self.s3 = boto3.client('s3')
    
    def create_s3_delivery_stream(self, delivery_stream_name, s3_bucket, s3_prefix='', 
                                  buffer_interval=60, buffer_size=5):
        """
        Create Firehose delivery stream to S3
        """
        try:
            response = self.firehose.create_delivery_stream(
                DeliveryStreamName=delivery_stream_name,
                DeliveryStreamType='DirectPut',
                S3DestinationConfiguration={
                    'RoleARN': 'arn:aws:iam::123456789012:role/firehose_delivery_role',
                    'BucketARN': f'arn:aws:s3:::{s3_bucket}',
                    'Prefix': s3_prefix,
                    'ErrorOutputPrefix': 'errors/',
                    'BufferingHints': {
                        'SizeInMBs': buffer_size,
                        'IntervalInSeconds': buffer_interval
                    },
                    'CompressionFormat': 'GZIP',
                    'EncryptionConfiguration': {
                        'NoEncryptionConfig': 'NoEncryption'
                    },
                    'CloudWatchLoggingOptions': {
                        'Enabled': True,
                        'LogGroupName': f'/aws/kinesisfirehose/{delivery_stream_name}'
                    },
                    'ProcessingConfiguration': {
                        'Enabled': False
                    }
                }
            )
            
            print(f"Delivery stream '{delivery_stream_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating delivery stream: {e}")
            return None
    
    def create_redshift_delivery_stream(self, delivery_stream_name, s3_bucket, 
                                        redshift_cluster_jdbc, redshift_table,
                                        redshift_username, redshift_password):
        """
        Create Firehose delivery stream to Redshift
        """
        try:
            response = self.firehose.create_delivery_stream(
                DeliveryStreamName=delivery_stream_name,
                DeliveryStreamType='DirectPut',
                RedshiftDestinationConfiguration={
                    'RoleARN': 'arn:aws:iam::123456789012:role/firehose_delivery_role',
                    'ClusterJDBCURL': redshift_cluster_jdbc,
                    'CopyCommand': {
                        'DataTableName': redshift_table,
                        'DataTableColumns': 'user_id,event_type,timestamp,metadata',
                        'CopyOptions': "JSON 'auto' GZIP"
                    },
                    'Username': redshift_username,
                    'Password': redshift_password,
                    'RetryDuration': 3600,
                    'S3Configuration': {
                        'RoleARN': 'arn:aws:iam::123456789012:role/firehose_delivery_role',
                        'BucketARN': f'arn:aws:s3:::{s3_bucket}',
                        'Prefix': 'redshift-staging/',
                        'ErrorOutputPrefix': 'redshift-errors/',
                        'BufferingHints': {
                            'SizeInMBs': 128,
                            'IntervalInSeconds': 60
                        },
                        'CompressionFormat': 'GZIP'
                    },
                    'ProcessingConfiguration': {
                        'Enabled': True,
                        'Processors': [
                            {
                                'Type': 'Lambda',
                                'Parameters': [
                                    {
                                        'ParameterName': 'LambdaArn',
                                        'ParameterValue': 'arn:aws:lambda:us-east-1:123456789012:function:firehose-transform'
                                    }
                                ]
                            }
                        ]
                    }
                }
            )
            
            print(f"Redshift delivery stream '{delivery_stream_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating Redshift delivery stream: {e}")
            return None
    
    def create_opensearch_delivery_stream(self, delivery_stream_name, domain_arn, 
                                          index_name, type_name='_doc'):
        """
        Create Firehose delivery stream to OpenSearch
        """
        try:
            response = self.firehose.create_delivery_stream(
                DeliveryStreamName=delivery_stream_name,
                DeliveryStreamType='DirectPut',
                AmazonOpenSearchServiceDestinationConfiguration={
                    'RoleARN': 'arn:aws:iam::123456789012:role/firehose_delivery_role',
                    'DomainARN': domain_arn,
                    'IndexName': index_name,
                    'TypeName': type_name,
                    'IndexRotationPeriod': 'OneDay',
                    'BufferingHints': {
                        'SizeInMBs': 5,
                        'IntervalInSeconds': 60
                    },
                    'RetryDuration': 300,
                    'S3BackupMode': 'AllDocuments',
                    'S3Configuration': {
                        'RoleARN': 'arn:aws:iam::123456789012:role/firehose_delivery_role',
                        'BucketARN': 'arn:aws:s3:::my-backup-bucket',
                        'Prefix': 'opensearch-backup/',
                        'ErrorOutputPrefix': 'opensearch-errors/',
                        'BufferingHints': {
                            'SizeInMBs': 10,
                            'IntervalInSeconds': 300
                        },
                        'CompressionFormat': 'GZIP'
                    }
                }
            )
            
            print(f"OpenSearch delivery stream '{delivery_stream_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating OpenSearch delivery stream: {e}")
            return None
    
    def put_record(self, delivery_stream_name, record_data):
        """
        Put single record to Firehose delivery stream
        """
        try:
            response = self.firehose.put_record(
                DeliveryStreamName=delivery_stream_name,
                Record={
                    'Data': json.dumps(record_data) + '\n' if isinstance(record_data, dict) else record_data
                }
            )
            
            return response['RecordId']
            
        except Exception as e:
            print(f"Error putting record: {e}")
            return None
    
    def put_record_batch(self, delivery_stream_name, records):
        """
        Put batch of records to Firehose delivery stream
        """
        try:
            firehose_records = []
            for record in records:
                data = json.dumps(record) + '\n' if isinstance(record, dict) else record
                firehose_records.append({'Data': data})
            
            response = self.firehose.put_record_batch(
                DeliveryStreamName=delivery_stream_name,
                Records=firehose_records
            )
            
            result = {
                'failed_put_count': response['FailedPutCount'],
                'successful_records': len(firehose_records) - response['FailedPutCount'],
                'request_responses': response['RequestResponses']
            }
            
            return result
            
        except Exception as e:
            print(f"Error putting record batch: {e}")
            return None
    
    def create_data_transformation_lambda(self):
        """
        Example Lambda function for data transformation
        """
        lambda_function_code = '''
import base64
import json
import gzip
from datetime import datetime

def lambda_handler(event, context):
    output = []
    
    for record in event['records']:
        # Decode the data
        compressed_payload = base64.b64decode(record['data'])
        uncompressed_payload = gzip.decompress(compressed_payload)
        data = json.loads(uncompressed_payload.decode('utf-8'))
        
        # Transform the data
        transformed_data = transform_record(data)
        
        # Encode the transformed data
        output_record = {
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(
                (json.dumps(transformed_data) + '\\n').encode('utf-8')
            ).decode('utf-8')
        }
        
        output.append(output_record)
    
    return {'records': output}

def transform_record(data):
    """
    Transform a single record
    """
    # Add transformation timestamp
    data['processed_timestamp'] = datetime.utcnow().isoformat()
    
    # Normalize event types
    if 'event_type' in data:
        data['event_type'] = data['event_type'].lower()
    
    # Add derived fields
    if 'timestamp' in data:
        try:
            ts = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            data['hour_of_day'] = ts.hour
            data['day_of_week'] = ts.weekday()
        except:
            pass
    
    # Filter out sensitive data
    sensitive_fields = ['password', 'ssn', 'credit_card']
    for field in sensitive_fields:
        if field in data:
            data[field] = '[REDACTED]'
    
    return data
'''
        
        return lambda_function_code

# Usage examples
firehose_manager = KinesisFirehoseManager()

# Create S3 delivery stream
s3_stream = firehose_manager.create_s3_delivery_stream(
    'my-s3-delivery-stream',
    'my-data-lake-bucket',
    s3_prefix='year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
    buffer_interval=60,
    buffer_size=5
)

# Create Redshift delivery stream
# redshift_stream = firehose_manager.create_redshift_delivery_stream(
#     'my-redshift-delivery-stream',
#     'my-staging-bucket',
#     'jdbc:redshift://mycluster.abc123.us-east-1.redshift.amazonaws.com:5439/mydb',
#     'events',
#     'username',
#     'password'
# )

# Put single record
record_id = firehose_manager.put_record(
    'my-s3-delivery-stream',
    {
        'user_id': 'user123',
        'event_type': 'page_view',
        'timestamp': datetime.utcnow().isoformat(),
        'page': 'homepage',
        'referrer': 'google.com'
    }
)

print(f"Record ID: {record_id}")

# Put batch records
batch_records = [
    {
        'user_id': 'user124',
        'event_type': 'click',
        'timestamp': datetime.utcnow().isoformat(),
        'element': 'buy_button'
    },
    {
        'user_id': 'user125',
        'event_type': 'purchase',
        'timestamp': datetime.utcnow().isoformat(),
        'amount': 99.99,
        'product_id': 'prod123'
    }
]

batch_result = firehose_manager.put_record_batch('my-s3-delivery-stream', batch_records)
print(f"Batch result: {batch_result}")

# Get transformation Lambda code
lambda_code = firehose_manager.create_data_transformation_lambda()
print("Data transformation Lambda function code:")
print(lambda_code)
```

## Kinesis Data Analytics {#data-analytics}

### Real-time Analytics with SQL

```python
class KinesisAnalyticsManager:
    def __init__(self):
        self.analytics = boto3.client('kinesisanalytics')
        self.analyticsv2 = boto3.client('kinesisanalyticsv2')
    
    def create_sql_application(self, application_name, input_stream_arn, output_stream_arn):
        """
        Create Kinesis Data Analytics SQL application (v1)
        """
        sql_code = """
-- Create input stream
CREATE OR REPLACE STREAM "SOURCE_SQL_STREAM_001" (
    user_id VARCHAR(32),
    event_type VARCHAR(16),
    timestamp TIMESTAMP,
    amount DOUBLE,
    metadata VARCHAR(1024)
);

-- Create output stream for aggregated data
CREATE OR REPLACE STREAM "DESTINATION_SQL_STREAM_001" (
    user_id VARCHAR(32),
    event_count INTEGER,
    total_amount DOUBLE,
    window_start TIMESTAMP,
    window_end TIMESTAMP
);

-- Windowed aggregation query
CREATE OR REPLACE PUMP "STREAM_PUMP_001" AS INSERT INTO "DESTINATION_SQL_STREAM_001"
SELECT STREAM
    user_id,
    COUNT(*) as event_count,
    SUM(amount) as total_amount,
    ROWTIME_TO_TIMESTAMP(MIN(ROWTIME)) as window_start,
    ROWTIME_TO_TIMESTAMP(MAX(ROWTIME)) as window_end
FROM "SOURCE_SQL_STREAM_001"
WHERE event_type = 'purchase'
GROUP BY user_id, 
         RANGE_INTERVAL '5' MINUTE;

-- Real-time anomaly detection
CREATE OR REPLACE STREAM "ANOMALY_STREAM_001" (
    user_id VARCHAR(32),
    event_count INTEGER,
    avg_amount DOUBLE,
    anomaly_score DOUBLE,
    window_timestamp TIMESTAMP
);

CREATE OR REPLACE PUMP "ANOMALY_PUMP_001" AS INSERT INTO "ANOMALY_STREAM_001"
SELECT STREAM
    user_id,
    event_count,
    avg_amount,
    CASE 
        WHEN event_count > 10 THEN event_count * 1.5
        WHEN avg_amount > 1000 THEN avg_amount / 100
        ELSE 0.0
    END as anomaly_score,
    ROWTIME_TO_TIMESTAMP(ROWTIME) as window_timestamp
FROM (
    SELECT STREAM
        user_id,
        COUNT(*) as event_count,
        AVG(amount) as avg_amount,
        ROWTIME
    FROM "SOURCE_SQL_STREAM_001"
    WHERE event_type = 'purchase'
    GROUP BY user_id,
             RANGE_INTERVAL '1' MINUTE
)
WHERE event_count > 5 OR avg_amount > 500;
"""
        
        try:
            response = self.analytics.create_application(
                ApplicationName=application_name,
                ApplicationDescription='Real-time analytics application',
                Inputs=[
                    {
                        'NamePrefix': 'SOURCE_SQL_STREAM',
                        'InputProcessingConfiguration': {
                            'InputLambdaProcessor': {
                                'ResourceARN': 'arn:aws:lambda:us-east-1:123456789012:function:analytics-processor',
                                'RoleARN': 'arn:aws:iam::123456789012:role/service-role/kinesis-analytics-role'
                            }
                        },
                        'KinesisStreamsInput': {
                            'ResourceARN': input_stream_arn,
                            'RoleARN': 'arn:aws:iam::123456789012:role/service-role/kinesis-analytics-role'
                        },
                        'InputSchema': {
                            'RecordFormat': {
                                'RecordFormatType': 'JSON',
                                'MappingParameters': {
                                    'JSONMappingParameters': {
                                        'RecordRowPath': '$'
                                    }
                                }
                            },
                            'RecordEncoding': 'UTF-8',
                            'RecordColumns': [
                                {
                                    'Name': 'user_id',
                                    'Mapping': '$.user_id',
                                    'SqlType': 'VARCHAR(32)'
                                },
                                {
                                    'Name': 'event_type',
                                    'Mapping': '$.event_type',
                                    'SqlType': 'VARCHAR(16)'
                                },
                                {
                                    'Name': 'timestamp',
                                    'Mapping': '$.timestamp',
                                    'SqlType': 'TIMESTAMP'
                                },
                                {
                                    'Name': 'amount',
                                    'Mapping': '$.amount',
                                    'SqlType': 'DOUBLE'
                                },
                                {
                                    'Name': 'metadata',
                                    'Mapping': '$.metadata',
                                    'SqlType': 'VARCHAR(1024)'
                                }
                            ]
                        }
                    }
                ],
                Outputs=[
                    {
                        'Name': 'DESTINATION_SQL_STREAM',
                        'KinesisStreamsOutput': {
                            'ResourceARN': output_stream_arn,
                            'RoleARN': 'arn:aws:iam::123456789012:role/service-role/kinesis-analytics-role'
                        },
                        'DestinationSchema': {
                            'RecordFormatType': 'JSON'
                        }
                    }
                ],
                ApplicationCode=sql_code
            )
            
            print(f"Analytics application '{application_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating analytics application: {e}")
            return None
    
    def create_flink_application(self, application_name, s3_bucket, s3_key):
        """
        Create Kinesis Data Analytics Flink application (v2)
        """
        try:
            response = self.analyticsv2.create_application(
                ApplicationName=application_name,
                ApplicationDescription='Flink streaming application',
                RuntimeEnvironment='FLINK-1_13',
                ServiceExecutionRole='arn:aws:iam::123456789012:role/service-role/kinesis-analytics-role',
                ApplicationConfiguration={
                    'ApplicationCodeConfiguration': {
                        'CodeContent': {
                            'S3ContentLocation': {
                                'BucketARN': f'arn:aws:s3:::{s3_bucket}',
                                'FileKey': s3_key
                            }
                        },
                        'CodeContentType': 'ZIPFILE'
                    },
                    'EnvironmentProperties': {
                        'PropertyGroups': [
                            {
                                'PropertyGroupId': 'kinesis.analytics.flink.run.options',
                                'PropertyMap': {
                                    'python': 'main.py',
                                    'jarfile': 'flink-app.jar'
                                }
                            }
                        ]
                    },
                    'FlinkApplicationConfiguration': {
                        'CheckpointConfiguration': {
                            'ConfigurationType': 'DEFAULT'
                        },
                        'MonitoringConfiguration': {
                            'ConfigurationType': 'CUSTOM',
                            'LogLevel': 'INFO',
                            'MetricsLevel': 'APPLICATION'
                        },
                        'ParallelismConfiguration': {
                            'ConfigurationType': 'CUSTOM',
                            'Parallelism': 2,
                            'ParallelismPerKPU': 1,
                            'AutoScalingEnabled': True
                        }
                    }
                }
            )
            
            print(f"Flink application '{application_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating Flink application: {e}")
            return None
    
    def generate_flink_python_code(self):
        """
        Generate example Flink Python application code
        """
        flink_code = '''
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment
from pyflink.table.descriptors import Schema, Rowtime, Json, Kafka
from pyflink.table.window import Tumble
import json

def main():
    # Set up execution environment
    env = StreamExecutionEnvironment.get_execution_environment()
    t_env = StreamTableEnvironment.create(env)
    
    # Configure checkpointing
    env.enable_checkpointing(60000)  # checkpoint every 60 seconds
    
    # Define source table (Kinesis Data Streams)
    source_ddl = """
        CREATE TABLE source_table (
            user_id STRING,
            event_type STRING,
            amount DOUBLE,
            event_timestamp TIMESTAMP(3),
            WATERMARK FOR event_timestamp AS event_timestamp - INTERVAL '5' SECOND
        ) WITH (
            'connector' = 'kinesis',
            'stream' = 'my-input-stream',
            'aws.region' = 'us-east-1',
            'scan.stream.initpos' = 'LATEST',
            'format' = 'json'
        )
    """
    
    # Define sink table (Kinesis Data Streams)
    sink_ddl = """
        CREATE TABLE sink_table (
            user_id STRING,
            event_count BIGINT,
            total_amount DOUBLE,
            window_start TIMESTAMP(3),
            window_end TIMESTAMP(3)
        ) WITH (
            'connector' = 'kinesis',
            'stream' = 'my-output-stream',
            'aws.region' = 'us-east-1',
            'format' = 'json'
        )
    """
    
    t_env.execute_sql(source_ddl)
    t_env.execute_sql(sink_ddl)
    
    # Define the processing logic
    result = t_env.sql_query("""
        SELECT 
            user_id,
            COUNT(*) as event_count,
            SUM(amount) as total_amount,
            TUMBLE_START(event_timestamp, INTERVAL '5' MINUTE) as window_start,
            TUMBLE_END(event_timestamp, INTERVAL '5' MINUTE) as window_end
        FROM source_table
        WHERE event_type = 'purchase'
        GROUP BY 
            user_id,
            TUMBLE(event_timestamp, INTERVAL '5' MINUTE)
    """)
    
    # Insert results into sink table
    result.execute_insert("sink_table")

if __name__ == '__main__':
    main()
'''
        
        return flink_code
    
    def start_application(self, application_name, input_configurations=None):
        """
        Start Kinesis Data Analytics application
        """
        try:
            response = self.analytics.start_application(
                ApplicationName=application_name,
                InputConfigurations=input_configurations or []
            )
            
            print(f"Application '{application_name}' started successfully")
            return response
            
        except Exception as e:
            print(f"Error starting application: {e}")
            return None

# Usage examples
analytics_manager = KinesisAnalyticsManager()

# Create SQL application
# sql_app = analytics_manager.create_sql_application(
#     'my-analytics-app',
#     'arn:aws:kinesis:us-east-1:123456789012:stream/my-input-stream',
#     'arn:aws:kinesis:us-east-1:123456789012:stream/my-output-stream'
# )

# Generate Flink application code
flink_code = analytics_manager.generate_flink_python_code()
print("Flink Python Application Code:")
print(flink_code)

# Create Flink application
# flink_app = analytics_manager.create_flink_application(
#     'my-flink-app',
#     'my-code-bucket',
#     'flink-apps/my-app.zip'
# )
```

## Real-time Processing Architectures {#processing-architectures}

### Lambda Integration for Stream Processing

```python
import json
import base64
import gzip
from datetime import datetime

class KinesisLambdaProcessor:
    """
    Example Lambda function for processing Kinesis streams
    """
    
    @staticmethod
    def lambda_handler(event, context):
        """
        Lambda handler for Kinesis stream processing
        """
        processed_records = 0
        failed_records = 0
        
        for record in event['Records']:
            try:
                # Decode and process the record
                payload = KinesisLambdaProcessor.decode_record(record)
                processed_data = KinesisLambdaProcessor.process_record(payload)
                
                # Store processed data (example with DynamoDB)
                KinesisLambdaProcessor.store_processed_record(processed_data)
                
                processed_records += 1
                
            except Exception as e:
                print(f"Error processing record: {e}")
                failed_records += 1
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed_records': processed_records,
                'failed_records': failed_records
            })
        }
    
    @staticmethod
    def decode_record(record):
        """
        Decode Kinesis record data
        """
        # Decode base64
        data = base64.b64decode(record['kinesis']['data'])
        
        # Handle gzip compression if present
        try:
            data = gzip.decompress(data)
        except:
            pass  # Not compressed
        
        # Parse JSON
        return json.loads(data.decode('utf-8'))
    
    @staticmethod
    def process_record(data):
        """
        Process individual record with business logic
        """
        processed_data = {
            'original_data': data,
            'processed_timestamp': datetime.utcnow().isoformat(),
            'processing_metadata': {}
        }
        
        # Example processing logic
        if 'event_type' in data:
            processed_data['event_category'] = KinesisLambdaProcessor.categorize_event(data['event_type'])
        
        if 'amount' in data:
            processed_data['amount_tier'] = KinesisLambdaProcessor.categorize_amount(data['amount'])
        
        # Add anomaly score
        processed_data['anomaly_score'] = KinesisLambdaProcessor.calculate_anomaly_score(data)
        
        return processed_data
    
    @staticmethod
    def categorize_event(event_type):
        """
        Categorize event types
        """
        categories = {
            'click': 'interaction',
            'view': 'interaction',
            'scroll': 'interaction',
            'purchase': 'transaction',
            'payment': 'transaction',
            'login': 'authentication',
            'logout': 'authentication',
            'signup': 'user_management'
        }
        
        return categories.get(event_type.lower(), 'other')
    
    @staticmethod
    def categorize_amount(amount):
        """
        Categorize transaction amounts
        """
        if amount < 10:
            return 'small'
        elif amount < 100:
            return 'medium'
        elif amount < 1000:
            return 'large'
        else:
            return 'enterprise'
    
    @staticmethod
    def calculate_anomaly_score(data):
        """
        Calculate anomaly score based on various factors
        """
        score = 0.0
        
        # Check for unusual timestamp
        try:
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            hour = timestamp.hour
            
            # Higher score for unusual hours (2-6 AM)
            if 2 <= hour <= 6:
                score += 0.3
                
        except:
            pass
        
        # Check for high amounts
        if 'amount' in data and data['amount'] > 1000:
            score += 0.4
        
        # Check for rapid events (would need session context)
        # This is a simplified example
        if 'session_id' in data and 'event_sequence' in data:
            if data['event_sequence'] > 10:  # More than 10 events in session
                score += 0.2
        
        return min(score, 1.0)  # Cap at 1.0
    
    @staticmethod
    def store_processed_record(processed_data):
        """
        Store processed record in DynamoDB
        """
        import boto3
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('ProcessedEvents')
        
        # Create item for DynamoDB
        item = {
            'event_id': processed_data.get('original_data', {}).get('event_id', 'unknown'),
            'user_id': processed_data.get('original_data', {}).get('user_id', 'unknown'),
            'processed_timestamp': processed_data['processed_timestamp'],
            'event_category': processed_data.get('event_category', 'unknown'),
            'anomaly_score': processed_data.get('anomaly_score', 0.0),
            'original_data': json.dumps(processed_data['original_data'])
        }
        
        try:
            table.put_item(Item=item)
        except Exception as e:
            print(f"Error storing record: {e}")
            raise

# Multi-consumer architecture example
class KinesisConsumerManager:
    def __init__(self):
        self.kinesis = boto3.client('kinesis')
    
    def create_consumer_application(self, stream_name, consumer_name, consumer_arn):
        """
        Create a consumer application using enhanced fan-out
        """
        try:
            response = self.kinesis.register_stream_consumer(
                StreamARN=f'arn:aws:kinesis:us-east-1:123456789012:stream/{stream_name}',
                ConsumerName=consumer_name
            )
            
            consumer_arn = response['Consumer']['ConsumerARN']
            print(f"Consumer '{consumer_name}' registered with ARN: {consumer_arn}")
            
            return consumer_arn
            
        except Exception as e:
            print(f"Error registering consumer: {e}")
            return None
    
    def subscribe_to_shard(self, consumer_arn, shard_id):
        """
        Subscribe to shard with enhanced fan-out
        """
        try:
            response = self.kinesis.subscribe_to_shard(
                ConsumerARN=consumer_arn,
                ShardId=shard_id,
                StartingPosition={
                    'Type': 'LATEST'
                }
            )
            
            # Process the event stream
            for event in response['EventStream']:
                if 'SubscribeToShardEvent' in event:
                    records = event['SubscribeToShardEvent']['Records']
                    for record in records:
                        self.process_enhanced_record(record)
            
        except Exception as e:
            print(f"Error subscribing to shard: {e}")
    
    def process_enhanced_record(self, record):
        """
        Process record from enhanced fan-out consumer
        """
        data = json.loads(record['Data'].decode('utf-8'))
        
        print(f"Processing record: {record['SequenceNumber']}")
        print(f"Data: {data}")
        print(f"Approximate arrival: {record['ApproximateArrivalTimestamp']}")

# Error handling and retry patterns
class KinesisErrorHandler:
    def __init__(self):
        self.kinesis = boto3.client('kinesis')
        self.sqs = boto3.client('sqs')
        self.dead_letter_queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/kinesis-dlq'
    
    def handle_processing_error(self, record, error):
        """
        Handle processing errors with retry logic and dead letter queue
        """
        retry_count = record.get('retry_count', 0)
        max_retries = 3
        
        if retry_count < max_retries:
            # Add retry metadata and put back to stream
            record['retry_count'] = retry_count + 1
            record['last_error'] = str(error)
            record['retry_timestamp'] = datetime.utcnow().isoformat()
            
            # Put record back to stream for retry
            self.put_record_for_retry(record)
            
        else:
            # Send to dead letter queue
            self.send_to_dead_letter_queue(record, error)
    
    def put_record_for_retry(self, record):
        """
        Put record back to stream for retry
        """
        try:
            self.kinesis.put_record(
                StreamName='retry-stream',
                Data=json.dumps(record),
                PartitionKey=record.get('partition_key', 'retry')
            )
        except Exception as e:
            print(f"Error putting record for retry: {e}")
    
    def send_to_dead_letter_queue(self, record, error):
        """
        Send failed record to dead letter queue
        """
        try:
            message_body = {
                'original_record': record,
                'processing_error': str(error),
                'failed_timestamp': datetime.utcnow().isoformat(),
                'retry_attempts': record.get('retry_count', 0)
            }
            
            self.sqs.send_message(
                QueueUrl=self.dead_letter_queue_url,
                MessageBody=json.dumps(message_body)
            )
            
            print(f"Record sent to dead letter queue: {record.get('event_id', 'unknown')}")
            
        except Exception as e:
            print(f"Error sending to dead letter queue: {e}")

# Usage examples
lambda_processor = KinesisLambdaProcessor()
consumer_manager = KinesisConsumerManager()
error_handler = KinesisErrorHandler()

# Example Lambda function code
print("Lambda Processor Class created - ready for deployment")

# Consumer registration example
consumer_arn = consumer_manager.create_consumer_application(
    'my-data-stream',
    'analytics-consumer',
    'arn:aws:kinesis:us-east-1:123456789012:stream/my-data-stream'
)

print("Real-time processing architecture components ready")
```

## Best Practices {#best-practices}

### Kinesis Optimization and Operational Excellence

```python
class KinesisBestPractices:
    def __init__(self):
        self.kinesis = boto3.client('kinesis')
        self.cloudwatch = boto3.client('cloudwatch')
    
    def implement_partitioning_strategy(self):
        """
        Implement effective partitioning strategies
        """
        partitioning_strategies = {
            'user_based': {
                'description': 'Partition by user ID for user-specific processing',
                'example': 'user_id',
                'benefits': ['Ordered processing per user', 'Easy scaling per user'],
                'considerations': ['Hot partitions if few active users', 'Uneven distribution']
            },
            'time_based': {
                'description': 'Partition by timestamp for time-series data',
                'example': 'timestamp_hour',
                'benefits': ['Even distribution over time', 'Time-ordered processing'],
                'considerations': ['All data goes to same partition at given time']
            },
            'hash_based': {
                'description': 'Partition using hash function for even distribution',
                'example': 'hash(user_id + session_id)',
                'benefits': ['Even distribution', 'Predictable partitioning'],
                'considerations': ['May break ordering guarantees']
            },
            'categorical': {
                'description': 'Partition by event type or category',
                'example': 'event_type',
                'benefits': ['Type-specific processing', 'Easy filtering'],
                'considerations': ['Uneven distribution if categories imbalanced']
            }
        }
        
        return partitioning_strategies
    
    def implement_monitoring_and_alerting(self, stream_name):
        """
        Set up comprehensive monitoring and alerting
        """
        # Create CloudWatch alarms for key metrics
        alarms = []
        
        # High incoming records alarm
        high_traffic_alarm = self.cloudwatch.put_metric_alarm(
            AlarmName=f'{stream_name}-HighIncomingRecords',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=2,
            MetricName='IncomingRecords',
            Namespace='AWS/Kinesis',
            Period=300,
            Statistic='Sum',
            Threshold=100000.0,
            ActionsEnabled=True,
            AlarmActions=[
                'arn:aws:sns:us-east-1:123456789012:kinesis-alerts'
            ],
            AlarmDescription='High incoming records detected',
            Dimensions=[
                {
                    'Name': 'StreamName',
                    'Value': stream_name
                }
            ],
            Unit='Count'
        )
        alarms.append('HighIncomingRecords')
        
        # Iterator age alarm (consumer lag)
        iterator_age_alarm = self.cloudwatch.put_metric_alarm(
            AlarmName=f'{stream_name}-HighIteratorAge',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=2,
            MetricName='GetRecords.IteratorAge',
            Namespace='AWS/Kinesis',
            Period=300,
            Statistic='Maximum',
            Threshold=60000.0,  # 60 seconds
            ActionsEnabled=True,
            AlarmActions=[
                'arn:aws:sns:us-east-1:123456789012:kinesis-alerts'
            ],
            AlarmDescription='Consumer lag detected',
            Dimensions=[
                {
                    'Name': 'StreamName',
                    'Value': stream_name
                }
            ],
            Unit='Milliseconds'
        )
        alarms.append('HighIteratorAge')
        
        # Write provisioned throughput exceeded
        write_throttle_alarm = self.cloudwatch.put_metric_alarm(
            AlarmName=f'{stream_name}-WriteProvisionedThroughputExceeded',
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName='WriteProvisionedThroughputExceeded',
            Namespace='AWS/Kinesis',
            Period=300,
            Statistic='Sum',
            Threshold=0.0,
            ActionsEnabled=True,
            AlarmActions=[
                'arn:aws:sns:us-east-1:123456789012:kinesis-alerts'
            ],
            AlarmDescription='Write throttling detected',
            Dimensions=[
                {
                    'Name': 'StreamName',
                    'Value': stream_name
                }
            ],
            Unit='Count'
        )
        alarms.append('WriteProvisionedThroughputExceeded')
        
        return alarms
    
    def implement_error_handling_patterns(self):
        """
        Implement comprehensive error handling patterns
        """
        error_patterns = {
            'exponential_backoff': '''
import time
import random

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            print(f"Retry attempt {attempt + 1} after {delay:.2f} seconds")
            time.sleep(delay)
    
    raise Exception("Max retries exceeded")
''',
            'circuit_breaker': '''
import time

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    def call(self, func):
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time >= self.timeout:
                self.state = 'HALF_OPEN'
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func()
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise e
    
    def on_success(self):
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
''',
            'dead_letter_queue': '''
import boto3
import json
from datetime import datetime

class DeadLetterQueueHandler:
    def __init__(self, queue_url):
        self.sqs = boto3.client('sqs')
        self.queue_url = queue_url
    
    def send_failed_record(self, record, error, retry_count=0):
        message = {
            'original_record': record,
            'error_message': str(error),
            'failure_timestamp': datetime.utcnow().isoformat(),
            'retry_count': retry_count,
            'source': 'kinesis_processor'
        }
        
        try:
            self.sqs.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(message),
                MessageAttributes={
                    'ErrorType': {
                        'StringValue': type(error).__name__,
                        'DataType': 'String'
                    },
                    'RetryCount': {
                        'StringValue': str(retry_count),
                        'DataType': 'Number'
                    }
                }
            )
        except Exception as e:
            print(f"Failed to send to DLQ: {e}")
'''
        }
        
        return error_patterns
    
    def implement_scaling_strategies(self, stream_name):
        """
        Implement scaling strategies for Kinesis streams
        """
        scaling_strategies = {
            'auto_scaling': {
                'description': 'Automatic scaling based on metrics',
                'implementation': self.setup_auto_scaling(stream_name),
                'triggers': [
                    'IncomingRecords > threshold',
                    'WriteProvisionedThroughputExceeded > 0',
                    'ReadProvisionedThroughputExceeded > 0'
                ]
            },
            'predictive_scaling': {
                'description': 'Scale based on predicted traffic patterns',
                'considerations': [
                    'Historical traffic analysis',
                    'Time-based scaling schedules',
                    'Event-driven scaling'
                ]
            },
            'on_demand_mode': {
                'description': 'Use on-demand capacity mode for variable workloads',
                'benefits': [
                    'No capacity planning required',
                    'Automatic scaling',
                    'Pay per use'
                ],
                'limitations': [
                    'Higher cost for consistent workloads',
                    'Default limits apply'
                ]
            }
        }
        
        return scaling_strategies
    
    def setup_auto_scaling(self, stream_name):
        """
        Set up auto-scaling for Kinesis stream
        """
        auto_scaling_config = {
            'lambda_function': '''
import boto3
import json

def lambda_handler(event, context):
    kinesis = boto3.client('kinesis')
    cloudwatch = boto3.client('cloudwatch')
    
    stream_name = event['stream_name']
    
    # Get current metrics
    metrics = get_stream_metrics(cloudwatch, stream_name)
    
    # Determine if scaling is needed
    current_shards = get_current_shard_count(kinesis, stream_name)
    target_shards = calculate_target_shards(metrics, current_shards)
    
    if target_shards != current_shards:
        scale_stream(kinesis, stream_name, target_shards)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'action': 'scaled',
                'from_shards': current_shards,
                'to_shards': target_shards
            })
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps({'action': 'no_scaling_needed'})
    }

def get_stream_metrics(cloudwatch, stream_name):
    # Implementation to get metrics
    pass

def get_current_shard_count(kinesis, stream_name):
    response = kinesis.describe_stream(StreamName=stream_name)
    return len(response['StreamDescription']['Shards'])

def calculate_target_shards(metrics, current_shards):
    # Scaling algorithm implementation
    incoming_records_per_sec = metrics.get('incoming_records_per_sec', 0)
    
    # Each shard can handle ~1000 records/sec or 1MB/sec
    target_shards = max(1, int(incoming_records_per_sec / 1000) + 1)
    
    # Limit scaling changes
    max_increase = current_shards * 2
    max_decrease = max(1, current_shards // 2)
    
    return max(max_decrease, min(target_shards, max_increase))

def scale_stream(kinesis, stream_name, target_shards):
    kinesis.update_shard_count(
        StreamName=stream_name,
        TargetShardCount=target_shards,
        ScalingType='UNIFORM_SCALING'
    )
''',
            'cloudwatch_rule': {
                'schedule': 'rate(5 minutes)',
                'target': 'scaling_lambda_function'
            }
        }
        
        return auto_scaling_config
    
    def implement_security_best_practices(self):
        """
        Implement security best practices
        """
        security_practices = {
            'encryption': {
                'at_rest': {
                    'description': 'Encrypt data at rest using AWS KMS',
                    'configuration': {
                        'EncryptionType': 'KMS',
                        'KeyId': 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
                    }
                },
                'in_transit': {
                    'description': 'All API calls use TLS 1.2',
                    'implementation': 'Automatic with AWS SDK'
                }
            },
            'access_control': {
                'iam_policies': '''
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "kinesis:PutRecord",
                "kinesis:PutRecords"
            ],
            "Resource": "arn:aws:kinesis:*:*:stream/my-stream"
        },
        {
            "Effect": "Allow",
            "Action": [
                "kinesis:DescribeStream",
                "kinesis:GetShardIterator",
                "kinesis:GetRecords"
            ],
            "Resource": "arn:aws:kinesis:*:*:stream/my-stream",
            "Condition": {
                "StringEquals": {
                    "kinesis:consumer-name": "my-application"
                }
            }
        }
    ]
}
''',
                'vpc_endpoints': {
                    'description': 'Use VPC endpoints for private connectivity',
                    'benefits': [
                        'Traffic stays within AWS network',
                        'Reduced data transfer costs',
                        'Enhanced security'
                    ]
                }
            },
            'monitoring': {
                'cloudtrail': 'Enable CloudTrail for API audit logging',
                'vpc_flow_logs': 'Enable VPC Flow Logs for network monitoring',
                'access_logging': 'Log all access attempts and patterns'
            }
        }
        
        return security_practices

# Best practices implementation
best_practices = KinesisBestPractices()

# Get partitioning strategies
partitioning = best_practices.implement_partitioning_strategy()
print("Kinesis Partitioning Strategies:")
print(json.dumps(partitioning, indent=2))

# Set up monitoring
alarms = best_practices.implement_monitoring_and_alerting('my-production-stream')
print(f"\nMonitoring alarms created: {alarms}")

# Get error handling patterns
error_patterns = best_practices.implement_error_handling_patterns()
print("\nError Handling Patterns:")
for pattern, code in error_patterns.items():
    print(f"\n{pattern}:")
    print(code)

# Get scaling strategies
scaling = best_practices.implement_scaling_strategies('my-production-stream')
print("\nScaling Strategies:")
print(json.dumps(scaling, indent=2, default=str))

# Get security best practices
security = best_practices.implement_security_best_practices()
print("\nSecurity Best Practices:")
print(json.dumps(security, indent=2))
```

## Cost Optimization {#cost-optimization}

### Kinesis Cost Management

```python
class KinesisCostOptimizer:
    def __init__(self):
        self.kinesis = boto3.client('kinesis')
        self.ce = boto3.client('ce')  # Cost Explorer
    
    def analyze_kinesis_costs(self, start_date, end_date):
        """
        Analyze Kinesis costs across all services
        """
        try:
            response = self.ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity='MONTHLY',
                Metrics=['BlendedCost', 'UsageQuantity'],
                GroupBy=[
                    {
                        'Type': 'DIMENSION',
                        'Key': 'SERVICE'
                    }
                ],
                Filter={
                    'Dimensions': {
                        'Key': 'SERVICE',
                        'Values': [
                            'Amazon Kinesis',
                            'Amazon Kinesis Firehose',
                            'Amazon Kinesis Analytics'
                        ]
                    }
                }
            )
            
            cost_breakdown = {}
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    service = group['Keys'][0]
                    cost = float(group['Metrics']['BlendedCost']['Amount'])
                    usage = float(group['Metrics']['UsageQuantity']['Amount'])
                    
                    if service not in cost_breakdown:
                        cost_breakdown[service] = {'cost': 0, 'usage': 0}
                    
                    cost_breakdown[service]['cost'] += cost
                    cost_breakdown[service]['usage'] += usage
            
            return cost_breakdown
            
        except Exception as e:
            print(f"Error analyzing Kinesis costs: {e}")
            return {}
    
    def optimize_data_streams(self):
        """
        Analyze and optimize Kinesis Data Streams costs
        """
        try:
            streams = self.kinesis.list_streams()
            
            optimization_recommendations = []
            
            for stream_name in streams['StreamNames']:
                stream_desc = self.kinesis.describe_stream(StreamName=stream_name)
                stream_info = stream_desc['StreamDescription']
                
                recommendations = []
                current_cost_per_month = 0
                potential_savings = 0
                
                # Analyze shard count and utilization
                shard_count = len(stream_info['Shards'])
                shard_cost_per_month = shard_count * 15  # $15 per shard per month
                current_cost_per_month += shard_cost_per_month
                
                # Check for over-provisioning
                if shard_count > 1:
                    recommendations.append({
                        'type': 'shard_optimization',
                        'description': 'Consider using on-demand mode for variable workloads',
                        'potential_monthly_savings': shard_cost_per_month * 0.3,
                        'action': 'Switch to on-demand capacity mode'
                    })
                
                # Check retention period
                retention_hours = stream_info['RetentionPeriodHours']
                if retention_hours > 168:  # More than 7 days
                    extended_retention_cost = (retention_hours - 24) * shard_count * 0.014
                    current_cost_per_month += extended_retention_cost
                    
                    recommendations.append({
                        'type': 'retention_optimization',
                        'description': f'Retention period is {retention_hours} hours',
                        'potential_monthly_savings': extended_retention_cost * 0.5,
                        'action': 'Review data retention requirements'
                    })
                
                # Check for encryption costs
                if stream_info.get('EncryptionType') == 'KMS':
                    kms_cost_estimate = shard_count * 2  # Rough estimate
                    current_cost_per_month += kms_cost_estimate
                    
                    if shard_count > 5:
                        recommendations.append({
                            'type': 'encryption_optimization',
                            'description': 'High KMS costs with many shards',
                            'potential_monthly_savings': kms_cost_estimate * 0.2,
                            'action': 'Consider using AWS owned keys for non-sensitive data'
                        })
                
                if recommendations:
                    total_potential_savings = sum(r['potential_monthly_savings'] for r in recommendations)
                    
                    optimization_recommendations.append({
                        'stream_name': stream_name,
                        'current_monthly_cost': current_cost_per_month,
                        'shard_count': shard_count,
                        'retention_hours': retention_hours,
                        'recommendations': recommendations,
                        'total_potential_savings': total_potential_savings
                    })
            
            return optimization_recommendations
            
        except Exception as e:
            print(f"Error optimizing data streams: {e}")
            return []
    
    def optimize_firehose_delivery_streams(self):
        """
        Optimize Firehose delivery streams for cost
        """
        try:
            response = self.firehose.list_delivery_streams()
            
            optimization_recommendations = []
            
            for stream_name in response['DeliveryStreamNames']:
                stream_desc = self.firehose.describe_delivery_stream(
                    DeliveryStreamName=stream_name
                )
                
                destinations = stream_desc['DeliveryStreamDescription']['Destinations']
                recommendations = []
                
                for dest in destinations:
                    # Check S3 configuration
                    if 'S3DestinationDescription' in dest:
                        s3_config = dest['S3DestinationDescription']
                        
                        # Check compression
                        if s3_config.get('CompressionFormat', 'UNCOMPRESSED') == 'UNCOMPRESSED':
                            recommendations.append({
                                'type': 'compression',
                                'description': 'Enable GZIP compression to reduce storage costs',
                                'potential_savings': '60-70% storage cost reduction',
                                'action': 'Enable GZIP compression'
                            })
                        
                        # Check buffering configuration
                        buffering = s3_config.get('BufferingHints', {})
                        buffer_size = buffering.get('SizeInMBs', 5)
                        buffer_interval = buffering.get('IntervalInSeconds', 300)
                        
                        if buffer_size < 128 or buffer_interval < 900:
                            recommendations.append({
                                'type': 'buffering_optimization',
                                'description': 'Optimize buffering to reduce API calls',
                                'potential_savings': '20-30% delivery cost reduction',
                                'action': f'Increase buffer size to 128MB and interval to 900s'
                            })
                    
                    # Check transformation costs
                    if 'ProcessingConfiguration' in dest and dest['ProcessingConfiguration']['Enabled']:
                        recommendations.append({
                            'type': 'transformation_review',
                            'description': 'Review data transformation necessity',
                            'potential_savings': 'Lambda execution cost savings',
                            'action': 'Review if all transformations are necessary'
                        })
                
                if recommendations:
                    optimization_recommendations.append({
                        'delivery_stream_name': stream_name,
                        'recommendations': recommendations
                    })
            
            return optimization_recommendations
            
        except Exception as e:
            print(f"Error optimizing Firehose streams: {e}")
            return []
    
    def calculate_cost_projections(self, usage_patterns):
        """
        Calculate cost projections for different usage patterns
        """
        cost_calculator = {
            'data_streams': {
                'provisioned_mode': {
                    'shard_hour': 0.015,  # $0.015 per shard hour
                    'put_payload_unit': 0.014,  # $0.014 per million PUT payload units
                    'extended_retention': 0.023  # $0.023 per shard hour for extended retention
                },
                'on_demand_mode': {
                    'data_in_per_gb': 0.033,  # $0.033 per GB data ingested
                    'data_out_per_gb': 0.055  # $0.055 per GB data retrieved
                }
            },
            'firehose': {
                'data_ingested_per_gb': 0.029,  # $0.029 per GB ingested
                'format_conversion_per_gb': 0.018,  # $0.018 per GB for format conversion
                'vpc_delivery_per_gb': 0.01  # $0.01 per GB for VPC delivery
            },
            'analytics': {
                'kpu_hour': 0.11,  # $0.11 per KPU hour
                'running_application_per_gb': 0.05  # $0.05 per GB processed
            }
        }
        
        projections = {}
        
        for service, patterns in usage_patterns.items():
            if service == 'data_streams':
                # Calculate both provisioned and on-demand costs
                provisioned_cost = self._calculate_data_streams_provisioned_cost(
                    patterns, cost_calculator['data_streams']['provisioned_mode']
                )
                on_demand_cost = self._calculate_data_streams_on_demand_cost(
                    patterns, cost_calculator['data_streams']['on_demand_mode']
                )
                
                projections[service] = {
                    'provisioned_monthly_cost': provisioned_cost,
                    'on_demand_monthly_cost': on_demand_cost,
                    'recommended_mode': 'on_demand' if on_demand_cost < provisioned_cost else 'provisioned',
                    'savings_opportunity': abs(provisioned_cost - on_demand_cost)
                }
            
            elif service == 'firehose':
                monthly_cost = patterns['gb_per_month'] * cost_calculator['firehose']['data_ingested_per_gb']
                if patterns.get('format_conversion', False):
                    monthly_cost += patterns['gb_per_month'] * cost_calculator['firehose']['format_conversion_per_gb']
                
                projections[service] = {
                    'monthly_cost': monthly_cost,
                    'cost_per_gb': cost_calculator['firehose']['data_ingested_per_gb']
                }
            
            elif service == 'analytics':
                monthly_cost = (patterns['kpu_hours_per_month'] * cost_calculator['analytics']['kpu_hour'] +
                               patterns['gb_processed_per_month'] * cost_calculator['analytics']['running_application_per_gb'])
                
                projections[service] = {
                    'monthly_cost': monthly_cost,
                    'kpu_cost': patterns['kpu_hours_per_month'] * cost_calculator['analytics']['kpu_hour'],
                    'processing_cost': patterns['gb_processed_per_month'] * cost_calculator['analytics']['running_application_per_gb']
                }
        
        return projections
    
    def _calculate_data_streams_provisioned_cost(self, patterns, pricing):
        """
        Calculate provisioned mode costs for data streams
        """
        monthly_hours = 24 * 30  # 720 hours per month
        
        shard_cost = patterns['shard_count'] * monthly_hours * pricing['shard_hour']
        put_cost = (patterns['records_per_month'] / 1000000) * pricing['put_payload_unit']
        
        extended_retention_cost = 0
        if patterns.get('retention_hours', 24) > 24:
            extended_hours = patterns['retention_hours'] - 24
            extended_retention_cost = (patterns['shard_count'] * extended_hours * 
                                     pricing['extended_retention'] * 30)  # 30 days
        
        return shard_cost + put_cost + extended_retention_cost
    
    def _calculate_data_streams_on_demand_cost(self, patterns, pricing):
        """
        Calculate on-demand mode costs for data streams
        """
        data_in_cost = patterns['gb_ingested_per_month'] * pricing['data_in_per_gb']
        data_out_cost = patterns['gb_retrieved_per_month'] * pricing['data_out_per_gb']
        
        return data_in_cost + data_out_cost
    
    def generate_cost_optimization_report(self):
        """
        Generate comprehensive cost optimization report
        """
        from datetime import datetime, timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)  # Last 3 months
        
        report = {
            'report_date': datetime.utcnow().isoformat(),
            'analysis_period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            'current_costs': self.analyze_kinesis_costs(start_date, end_date),
            'data_streams_optimization': self.optimize_data_streams(),
            'firehose_optimization': self.optimize_firehose_delivery_streams(),
            'recommendations_summary': {
                'immediate_actions': [
                    'Enable compression on Firehose delivery streams',
                    'Review data retention periods for streams',
                    'Consider on-demand mode for variable workloads',
                    'Optimize buffering configurations'
                ],
                'cost_reduction_strategies': [
                    'Right-size shard counts based on actual usage',
                    'Implement data lifecycle policies',
                    'Use appropriate compression formats',
                    'Optimize data transformation logic'
                ]
            }
        }
        
        # Calculate total potential savings
        total_savings = 0
        for stream_opt in report['data_streams_optimization']:
            total_savings += stream_opt.get('total_potential_savings', 0)
        
        report['total_monthly_savings_potential'] = total_savings
        report['annual_savings_projection'] = total_savings * 12
        
        return report

# Cost optimization examples
cost_optimizer = KinesisCostOptimizer()

# Example usage patterns for cost projection
usage_patterns = {
    'data_streams': {
        'shard_count': 5,
        'records_per_month': 10000000,  # 10M records
        'gb_ingested_per_month': 100,
        'gb_retrieved_per_month': 50,
        'retention_hours': 168  # 7 days
    },
    'firehose': {
        'gb_per_month': 500,
        'format_conversion': True
    },
    'analytics': {
        'kpu_hours_per_month': 720,  # 1 KPU running 24/7
        'gb_processed_per_month': 1000
    }
}

# Calculate cost projections
projections = cost_optimizer.calculate_cost_projections(usage_patterns)
print("Kinesis Cost Projections:")
print(json.dumps(projections, indent=2))

# Generate comprehensive cost optimization report
report = cost_optimizer.generate_cost_optimization_report()
print("\nKinesis Cost Optimization Report:")
print(json.dumps(report, indent=2, default=str))

print(f"\nTotal Monthly Savings Potential: ${report['total_monthly_savings_potential']:.2f}")
print(f"Annual Savings Projection: ${report['annual_savings_projection']:.2f}")
```

## Conclusion

Amazon Kinesis provides a comprehensive platform for real-time data streaming and analytics on AWS. Key takeaways:

### Essential Services:
- **Kinesis Data Streams**: Real-time data ingestion and processing with configurable retention
- **Kinesis Data Firehose**: Serverless data delivery to AWS data stores with transformation capabilities
- **Kinesis Data Analytics**: Real-time analytics with SQL and Apache Flink
- **Kinesis Video Streams**: Video streaming for analytics and machine learning

### Advanced Capabilities:
- **Multiple ingestion patterns**: Producer libraries, direct API calls, and agent-based collection
- **Flexible consumer models**: Lambda integration, enhanced fan-out, and custom consumers
- **Real-time processing**: Stream processing with windowing, aggregation, and complex event processing
- **Seamless integration**: Native integration with AWS services and third-party tools

### Best Practices:
- Implement effective partitioning strategies for optimal performance and scaling
- Set up comprehensive monitoring and alerting for operational excellence
- Use appropriate error handling patterns with retries and dead letter queues
- Implement security best practices with encryption and access controls
- Optimize costs through right-sizing, compression, and appropriate capacity modes

### Cost Optimization Strategies:
- Choose between provisioned and on-demand capacity modes based on usage patterns
- Enable compression to reduce storage and transfer costs
- Optimize buffering configurations to reduce API calls
- Review data retention periods and transformation requirements
- Monitor usage patterns and adjust capacity accordingly

### Operational Excellence:
- Implement comprehensive monitoring with CloudWatch metrics and alarms
- Use infrastructure as code for deployment and configuration management
- Establish disaster recovery and backup strategies
- Maintain proper documentation and runbooks
- Regular cost reviews and optimization cycles

Amazon Kinesis enables organizations to build real-time data processing architectures that can handle massive scale while providing the flexibility to process data as it arrives, making it ideal for modern data-driven applications requiring immediate insights and responses.