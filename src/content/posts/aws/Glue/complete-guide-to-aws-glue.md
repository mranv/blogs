---
title: "The Complete Guide to AWS Glue: Serverless ETL and Data Catalog Management"
description: "Master AWS Glue with this comprehensive guide covering ETL jobs, Data Catalog, crawlers, and advanced data processing workflows for analytics and machine learning."
publishDate: 2024-12-09
author: "Anubhav Gain"
category: "Cloud Computing"
tags:
  - aws
  - glue
  - etl
  - data-catalog
  - serverless
  - data-processing
  - analytics
  - spark
  - crawler
featured: true
draft: false
slug: "complete-guide-aws-glue-etl"
---

# The Complete Guide to AWS Glue: Serverless ETL and Data Catalog Management

AWS Glue is a fully managed extract, transform, and load (ETL) service that makes it easy to prepare and load data for analytics. This comprehensive guide covers all aspects of AWS Glue, from basic data cataloging to advanced ETL workflows and optimization strategies.

## Table of Contents
1. [Introduction to AWS Glue](#introduction)
2. [Core Components](#core-components)
3. [AWS Glue Data Catalog](#data-catalog)
4. [Crawlers and Schema Discovery](#crawlers)
5. [ETL Jobs and Development](#etl-jobs)
6. [AWS Glue Studio](#glue-studio)
7. [Data Transformations](#data-transformations)
8. [Integration Patterns](#integration-patterns)
9. [Performance Optimization](#performance-optimization)
10. [Monitoring and Debugging](#monitoring-debugging)
11. [Security and Governance](#security-governance)
12. [Best Practices](#best-practices)
13. [Cost Optimization](#cost-optimization)
14. [Troubleshooting](#troubleshooting)

## Introduction to AWS Glue {#introduction}

AWS Glue is a serverless data integration service that simplifies data preparation and loading for analytics and machine learning. It provides both visual and code-based interfaces for building ETL workflows.

### Key Benefits:
- **Serverless**: No infrastructure to manage
- **Scalable**: Automatically scales based on workload
- **Cost-effective**: Pay only for resources used during job execution
- **Integrated**: Works seamlessly with other AWS services
- **Code Generation**: Automatically generates ETL code

### Use Cases:
- Data lake and data warehouse preparation
- Real-time and batch data processing
- Data cataloging and discovery
- Schema evolution management
- Data quality and validation

## Core Components {#core-components}

```python
import boto3
import json
from datetime import datetime

# Initialize AWS Glue clients
glue = boto3.client('glue')
s3 = boto3.client('s3')

def glue_components_overview():
    """
    Overview of AWS Glue components and their purposes
    """
    components = {
        "data_catalog": {
            "description": "Centralized metadata repository",
            "components": [
                "Databases",
                "Tables", 
                "Partitions",
                "Connections"
            ],
            "benefits": [
                "Schema discovery and evolution",
                "Data lineage tracking",
                "Cross-service metadata sharing",
                "Query optimization"
            ]
        },
        "crawlers": {
            "description": "Automated schema discovery and cataloging",
            "capabilities": [
                "Schema inference from data",
                "Partition discovery",
                "Schema evolution handling",
                "Scheduled crawling"
            ],
            "supported_sources": [
                "Amazon S3",
                "Amazon RDS",
                "Amazon Redshift",
                "JDBC databases",
                "DynamoDB"
            ]
        },
        "etl_jobs": {
            "description": "Data transformation and loading workflows",
            "types": [
                "Apache Spark jobs",
                "Python Shell jobs",
                "Ray jobs"
            ],
            "execution_modes": [
                "Serverless",
                "Traditional (with DPUs)"
            ]
        },
        "glue_studio": {
            "description": "Visual interface for ETL job creation",
            "features": [
                "Drag-and-drop interface",
                "Pre-built transforms",
                "Code generation",
                "Job monitoring"
            ]
        },
        "data_brew": {
            "description": "Visual data preparation tool",
            "capabilities": [
                "Data profiling",
                "Data cleaning",
                "Recipe-based transformations",
                "Data quality rules"
            ]
        }
    }
    
    return components

print("AWS Glue Components Overview:")
print(json.dumps(glue_components_overview(), indent=2))
```

## AWS Glue Data Catalog {#data-catalog}

### Managing Databases and Tables

```python
class GlueCatalogManager:
    def __init__(self):
        self.glue = boto3.client('glue')
    
    def create_database(self, database_name, description=""):
        """
        Create a Glue database
        """
        try:
            response = self.glue.create_database(
                DatabaseInput={
                    'Name': database_name,
                    'Description': description or f'Database for {database_name} data',
                    'Parameters': {
                        'classification': 'database',
                        'owner': 'data-engineering-team',
                        'created_by': 'glue-automation'
                    }
                }
            )
            
            print(f"Database '{database_name}' created successfully")
            return response
            
        except self.glue.exceptions.AlreadyExistsException:
            print(f"Database '{database_name}' already exists")
        except Exception as e:
            print(f"Error creating database: {e}")
            return None
    
    def create_table(self, database_name, table_name, s3_location, 
                     input_format, output_format, serde_info, columns, partitions=None):
        """
        Create a table in the Glue Data Catalog
        """
        try:
            storage_descriptor = {
                'Columns': columns,
                'Location': s3_location,
                'InputFormat': input_format,
                'OutputFormat': output_format,
                'SerdeInfo': serde_info,
                'Compressed': False,
                'StoredAsSubDirectories': False
            }
            
            table_input = {
                'Name': table_name,
                'Description': f'Table {table_name} in {database_name}',
                'StorageDescriptor': storage_descriptor,
                'Parameters': {
                    'classification': self._get_classification(input_format),
                    'compressionType': 'none',
                    'typeOfData': 'file'
                }
            }
            
            if partitions:
                table_input['PartitionKeys'] = partitions
            
            response = self.glue.create_table(
                DatabaseName=database_name,
                TableInput=table_input
            )
            
            print(f"Table '{table_name}' created in database '{database_name}'")
            return response
            
        except Exception as e:
            print(f"Error creating table: {e}")
            return None
    
    def create_parquet_table(self, database_name, table_name, s3_location, columns, partitions=None):
        """
        Create a Parquet table with standard configuration
        """
        return self.create_table(
            database_name=database_name,
            table_name=table_name,
            s3_location=s3_location,
            input_format='org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
            output_format='org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
            serde_info={
                'SerializationLibrary': 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
            },
            columns=columns,
            partitions=partitions
        )
    
    def create_json_table(self, database_name, table_name, s3_location, columns, partitions=None):
        """
        Create a JSON table with standard configuration
        """
        return self.create_table(
            database_name=database_name,
            table_name=table_name,
            s3_location=s3_location,
            input_format='org.apache.hadoop.mapred.TextInputFormat',
            output_format='org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
            serde_info={
                'SerializationLibrary': 'org.openx.data.jsonserde.JsonSerDe'
            },
            columns=columns,
            partitions=partitions
        )
    
    def create_csv_table(self, database_name, table_name, s3_location, columns, 
                         delimiter=',', partitions=None):
        """
        Create a CSV table with standard configuration
        """
        return self.create_table(
            database_name=database_name,
            table_name=table_name,
            s3_location=s3_location,
            input_format='org.apache.hadoop.mapred.TextInputFormat',
            output_format='org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
            serde_info={
                'SerializationLibrary': 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
                'Parameters': {
                    'field.delim': delimiter,
                    'skip.header.line.count': '1'
                }
            },
            columns=columns,
            partitions=partitions
        )
    
    def update_table_schema(self, database_name, table_name, new_columns, version_id=None):
        """
        Update table schema with new columns
        """
        try:
            # Get current table definition
            current_table = self.glue.get_table(
                DatabaseName=database_name,
                Name=table_name
            )
            
            # Update storage descriptor with new columns
            table_input = current_table['Table']
            table_input['StorageDescriptor']['Columns'] = new_columns
            
            # Remove read-only fields
            for field in ['CreatedBy', 'CreateTime', 'UpdateTime', 'DatabaseName']:
                table_input.pop(field, None)
            
            response = self.glue.update_table(
                DatabaseName=database_name,
                TableInput=table_input,
                VersionId=version_id
            )
            
            print(f"Table '{table_name}' schema updated successfully")
            return response
            
        except Exception as e:
            print(f"Error updating table schema: {e}")
            return None
    
    def add_partition(self, database_name, table_name, partition_values, storage_location):
        """
        Add a partition to a table
        """
        try:
            # Get table to understand partition structure
            table = self.glue.get_table(
                DatabaseName=database_name,
                Name=table_name
            )
            
            partition_keys = table['Table'].get('PartitionKeys', [])
            
            if len(partition_values) != len(partition_keys):
                raise ValueError(f"Expected {len(partition_keys)} partition values, got {len(partition_values)}")
            
            storage_descriptor = table['Table']['StorageDescriptor'].copy()
            storage_descriptor['Location'] = storage_location
            
            response = self.glue.create_partition(
                DatabaseName=database_name,
                TableName=table_name,
                PartitionInput={
                    'Values': partition_values,
                    'StorageDescriptor': storage_descriptor,
                    'Parameters': {
                        'last_modified_by': 'glue-automation',
                        'last_modified_time': str(int(datetime.utcnow().timestamp()))
                    }
                }
            )
            
            print(f"Partition {partition_values} added to table '{table_name}'")
            return response
            
        except Exception as e:
            print(f"Error adding partition: {e}")
            return None
    
    def _get_classification(self, input_format):
        """
        Get classification based on input format
        """
        format_mapping = {
            'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat': 'parquet',
            'org.apache.hadoop.mapred.TextInputFormat': 'csv',
            'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat': 'orc'
        }
        
        return format_mapping.get(input_format, 'unknown')
    
    def list_tables(self, database_name):
        """
        List all tables in a database
        """
        try:
            response = self.glue.get_tables(DatabaseName=database_name)
            
            tables_info = []
            for table in response['TableList']:
                tables_info.append({
                    'name': table['Name'],
                    'location': table['StorageDescriptor'].get('Location', 'N/A'),
                    'input_format': table['StorageDescriptor'].get('InputFormat', 'N/A'),
                    'columns': len(table['StorageDescriptor'].get('Columns', [])),
                    'partitions': len(table.get('PartitionKeys', []))
                })
            
            return tables_info
            
        except Exception as e:
            print(f"Error listing tables: {e}")
            return []

# Usage examples
catalog_manager = GlueCatalogManager()

# Create database
catalog_manager.create_database('ecommerce_data', 'E-commerce analytics data')

# Define columns for different table types
user_columns = [
    {'Name': 'user_id', 'Type': 'string'},
    {'Name': 'email', 'Type': 'string'},
    {'Name': 'registration_date', 'Type': 'timestamp'},
    {'Name': 'country', 'Type': 'string'},
    {'Name': 'age', 'Type': 'int'},
    {'Name': 'subscription_tier', 'Type': 'string'}
]

order_columns = [
    {'Name': 'order_id', 'Type': 'string'},
    {'Name': 'user_id', 'Type': 'string'},
    {'Name': 'product_id', 'Type': 'string'},
    {'Name': 'quantity', 'Type': 'int'},
    {'Name': 'price', 'Type': 'decimal(10,2)'},
    {'Name': 'order_timestamp', 'Type': 'timestamp'},
    {'Name': 'status', 'Type': 'string'}
]

# Define partition keys
date_partitions = [
    {'Name': 'year', 'Type': 'string'},
    {'Name': 'month', 'Type': 'string'},
    {'Name': 'day', 'Type': 'string'}
]

# Create tables with different formats
catalog_manager.create_parquet_table(
    'ecommerce_data',
    'users',
    's3://my-data-lake/users/',
    user_columns
)

catalog_manager.create_parquet_table(
    'ecommerce_data',
    'orders',
    's3://my-data-lake/orders/',
    order_columns,
    partitions=date_partitions
)

catalog_manager.create_json_table(
    'ecommerce_data',
    'events',
    's3://my-data-lake/events/',
    [
        {'Name': 'event_id', 'Type': 'string'},
        {'Name': 'user_id', 'Type': 'string'},
        {'Name': 'event_type', 'Type': 'string'},
        {'Name': 'properties', 'Type': 'string'},
        {'Name': 'timestamp', 'Type': 'timestamp'}
    ],
    partitions=date_partitions
)

# Add partition to orders table
catalog_manager.add_partition(
    'ecommerce_data',
    'orders',
    ['2024', '01', '15'],
    's3://my-data-lake/orders/year=2024/month=01/day=15/'
)

# List tables
tables = catalog_manager.list_tables('ecommerce_data')
print("Tables in ecommerce_data database:")
for table in tables:
    print(f"  {table['name']}: {table['columns']} columns, {table['partitions']} partition keys")
```

## Crawlers and Schema Discovery {#crawlers}

### Creating and Managing Crawlers

```python
class GlueCrawlerManager:
    def __init__(self):
        self.glue = boto3.client('glue')
        self.iam = boto3.client('iam')
    
    def create_crawler_role(self, role_name):
        """
        Create IAM role for Glue crawler
        """
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "glue.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description='IAM role for AWS Glue crawler'
            )
            
            # Attach required policies
            policies = [
                'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole',
                'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
            ]
            
            for policy_arn in policies:
                self.iam.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy_arn
                )
            
            role_arn = response['Role']['Arn']
            print(f"Crawler role created: {role_arn}")
            return role_arn
            
        except Exception as e:
            print(f"Error creating crawler role: {e}")
            return None
    
    def create_s3_crawler(self, crawler_name, database_name, s3_path, role_arn, 
                          schedule=None, table_prefix=""):
        """
        Create a crawler for S3 data sources
        """
        try:
            crawler_config = {
                'Name': crawler_name,
                'Role': role_arn,
                'DatabaseName': database_name,
                'Description': f'Crawler for {s3_path}',
                'Targets': {
                    'S3Targets': [
                        {
                            'Path': s3_path,
                            'Exclusions': [
                                '**/_temporary/**',
                                '**/_SUCCESS',
                                '**/.DS_Store'
                            ]
                        }
                    ]
                },
                'TablePrefix': table_prefix,
                'SchemaChangePolicy': {
                    'UpdateBehavior': 'UPDATE_IN_DATABASE',
                    'DeleteBehavior': 'LOG'
                },
                'RecrawlPolicy': {
                    'RecrawlBehavior': 'CRAWL_EVERYTHING'
                },
                'LineageConfiguration': {
                    'CrawlerLineageSettings': 'ENABLE'
                },
                'Configuration': json.dumps({
                    "Version": 1.0,
                    "CrawlerOutput": {
                        "Partitions": {"AddOrUpdateBehavior": "InheritFromTable"},
                        "Tables": {"AddOrUpdateBehavior": "MergeNewColumns"}
                    }
                })
            }
            
            if schedule:
                crawler_config['Schedule'] = schedule
            
            response = self.glue.create_crawler(**crawler_config)
            
            print(f"S3 crawler '{crawler_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating S3 crawler: {e}")
            return None
    
    def create_jdbc_crawler(self, crawler_name, database_name, connection_name, 
                           jdbc_path, role_arn, schedule=None):
        """
        Create a crawler for JDBC data sources
        """
        try:
            crawler_config = {
                'Name': crawler_name,
                'Role': role_arn,
                'DatabaseName': database_name,
                'Description': f'JDBC crawler for {jdbc_path}',
                'Targets': {
                    'JdbcTargets': [
                        {
                            'ConnectionName': connection_name,
                            'Path': jdbc_path
                        }
                    ]
                },
                'SchemaChangePolicy': {
                    'UpdateBehavior': 'UPDATE_IN_DATABASE',
                    'DeleteBehavior': 'LOG'
                }
            }
            
            if schedule:
                crawler_config['Schedule'] = schedule
            
            response = self.glue.create_crawler(**crawler_config)
            
            print(f"JDBC crawler '{crawler_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating JDBC crawler: {e}")
            return None
    
    def create_connection(self, connection_name, connection_type, connection_properties):
        """
        Create a Glue connection for databases
        """
        try:
            response = self.glue.create_connection(
                ConnectionInput={
                    'Name': connection_name,
                    'Description': f'Connection for {connection_type}',
                    'ConnectionType': connection_type,
                    'ConnectionProperties': connection_properties,
                    'PhysicalConnectionRequirements': {
                        'SubnetId': 'subnet-12345678',  # Replace with your subnet
                        'SecurityGroupIdList': ['sg-12345678'],  # Replace with your security group
                        'AvailabilityZone': 'us-east-1a'
                    }
                }
            )
            
            print(f"Connection '{connection_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating connection: {e}")
            return None
    
    def run_crawler(self, crawler_name):
        """
        Start a crawler run
        """
        try:
            response = self.glue.start_crawler(Name=crawler_name)
            print(f"Crawler '{crawler_name}' started successfully")
            return response
            
        except Exception as e:
            print(f"Error starting crawler: {e}")
            return None
    
    def get_crawler_metrics(self, crawler_names):
        """
        Get metrics for crawlers
        """
        try:
            response = self.glue.get_crawler_metrics(CrawlerNameList=crawler_names)
            
            metrics_summary = []
            for metric in response['CrawlerMetricsList']:
                metrics_summary.append({
                    'crawler_name': metric['CrawlerName'],
                    'tables_created': metric.get('TablesCreated', 0),
                    'tables_updated': metric.get('TablesUpdated', 0),
                    'tables_deleted': metric.get('TablesDeleted', 0),
                    'last_runtime_seconds': metric.get('LastRuntimeSeconds', 0),
                    'median_runtime_seconds': metric.get('MedianRuntimeSeconds', 0),
                    'still_estimating': metric.get('StillEstimating', False)
                })
            
            return metrics_summary
            
        except Exception as e:
            print(f"Error getting crawler metrics: {e}")
            return []
    
    def setup_incremental_crawling(self, crawler_name, database_name, s3_path, role_arn):
        """
        Set up incremental crawling with optimized configuration
        """
        try:
            # Create crawler with incremental settings
            crawler_config = {
                'Name': crawler_name,
                'Role': role_arn,
                'DatabaseName': database_name,
                'Description': f'Incremental crawler for {s3_path}',
                'Targets': {
                    'S3Targets': [
                        {
                            'Path': s3_path,
                            'Exclusions': [
                                '**/_temporary/**',
                                '**/_SUCCESS',
                                '**/.DS_Store'
                            ]
                        }
                    ]
                },
                'SchemaChangePolicy': {
                    'UpdateBehavior': 'UPDATE_IN_DATABASE',
                    'DeleteBehavior': 'DEPRECATE_IN_DATABASE'
                },
                'RecrawlPolicy': {
                    'RecrawlBehavior': 'CRAWL_NEW_FOLDERS_ONLY'
                },
                'Configuration': json.dumps({
                    "Version": 1.0,
                    "Grouping": {
                        "TableGroupingPolicy": "CombineCompatibleSchemas"
                    },
                    "CrawlerOutput": {
                        "Partitions": {"AddOrUpdateBehavior": "InheritFromTable"},
                        "Tables": {"AddOrUpdateBehavior": "MergeNewColumns"}
                    }
                })
            }
            
            response = self.glue.create_crawler(**crawler_config)
            print(f"Incremental crawler '{crawler_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating incremental crawler: {e}")
            return None

# Usage examples
crawler_manager = GlueCrawlerManager()

# Create crawler role
role_arn = crawler_manager.create_crawler_role('GlueCrawlerRole')

if role_arn:
    # Create S3 crawler for data lake
    crawler_manager.create_s3_crawler(
        'ecommerce-data-crawler',
        'ecommerce_data',
        's3://my-data-lake/raw/',
        role_arn,
        schedule='cron(0 2 * * ? *)',  # Daily at 2 AM
        table_prefix='raw_'
    )
    
    # Create incremental crawler
    crawler_manager.setup_incremental_crawling(
        'ecommerce-incremental-crawler',
        'ecommerce_data',
        's3://my-data-lake/incremental/',
        role_arn
    )
    
    # Create JDBC connection and crawler
    postgres_connection_props = {
        'JDBC_CONNECTION_URL': 'jdbc:postgresql://mydb.cluster-xyz.us-east-1.rds.amazonaws.com:5432/production',
        'USERNAME': 'glue_user',
        'PASSWORD': 'secure_password'
    }
    
    crawler_manager.create_connection(
        'postgres-production',
        'JDBC',
        postgres_connection_props
    )
    
    crawler_manager.create_jdbc_crawler(
        'postgres-production-crawler',
        'production_replica',
        'postgres-production',
        'production/%',
        role_arn,
        schedule='cron(0 3 * * ? *)'  # Daily at 3 AM
    )
    
    # Run crawler
    crawler_manager.run_crawler('ecommerce-data-crawler')
    
    # Get crawler metrics
    metrics = crawler_manager.get_crawler_metrics(['ecommerce-data-crawler'])
    print("Crawler Metrics:")
    for metric in metrics:
        print(f"  {metric['crawler_name']}: {metric['tables_created']} tables created, "
              f"{metric['last_runtime_seconds']}s runtime")
```

## ETL Jobs and Development {#etl-jobs}

### Creating and Managing ETL Jobs

```python
class GlueETLManager:
    def __init__(self):
        self.glue = boto3.client('glue')
        self.s3 = boto3.client('s3')
    
    def create_etl_job(self, job_name, script_location, role_arn, job_type='glueetl',
                       max_capacity=None, worker_type=None, number_of_workers=None,
                       timeout=2880, max_retries=1):
        """
        Create an ETL job with flexible configuration
        """
        try:
            job_config = {
                'Name': job_name,
                'Description': f'ETL job: {job_name}',
                'Role': role_arn,
                'Command': {
                    'Name': job_type,
                    'ScriptLocation': script_location,
                    'PythonVersion': '3'
                },
                'DefaultArguments': {
                    '--TempDir': 's3://my-glue-temp-bucket/temp/',
                    '--job-bookmark-option': 'job-bookmark-enable',
                    '--enable-metrics': '',
                    '--enable-continuous-cloudwatch-log': 'true',
                    '--enable-glue-datacatalog': 'true'
                },
                'MaxRetries': max_retries,
                'Timeout': timeout,
                'GlueVersion': '4.0'
            }
            
            # Configure capacity based on job type
            if job_type == 'glueetl':
                if worker_type and number_of_workers:
                    job_config['WorkerType'] = worker_type
                    job_config['NumberOfWorkers'] = number_of_workers
                elif max_capacity:
                    job_config['MaxCapacity'] = max_capacity
                else:
                    job_config['WorkerType'] = 'G.1X'
                    job_config['NumberOfWorkers'] = 2
            elif job_type == 'pythonshell':
                job_config['MaxCapacity'] = 0.0625  # 1/16 DPU for Python shell
            
            response = self.glue.create_job(**job_config)
            
            print(f"ETL job '{job_name}' created successfully")
            return response
            
        except Exception as e:
            print(f"Error creating ETL job: {e}")
            return None
    
    def create_spark_etl_script(self, source_database, source_table, 
                                target_s3_path, transformations=None):
        """
        Generate a Spark ETL script template
        """
        script_template = f'''
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame
from pyspark.sql import functions as F
from pyspark.sql.types import *
import boto3

# Initialize Glue context
args = getResolvedOptions(sys.argv, [
    'JOB_NAME',
    'source_database',
    'source_table', 
    'target_s3_path'
])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Create logger
logger = glueContext.get_logger()
logger.info(f"Starting ETL job: {{args['JOB_NAME']}}")

try:
    # Read from Data Catalog
    source_df = glueContext.create_dynamic_frame.from_catalog(
        database=args.get('source_database', '{source_database}'),
        table_name=args.get('source_table', '{source_table}'),
        transformation_ctx="source_df"
    )
    
    logger.info(f"Read {{source_df.count()}} records from source")
    
    # Convert to Spark DataFrame for complex transformations
    spark_df = source_df.toDF()
    
    # Data Quality Checks
    initial_count = spark_df.count()
    logger.info(f"Initial record count: {{initial_count}}")
    
    # Remove null values from critical columns
    spark_df = spark_df.filter(F.col("id").isNotNull())
    
    # Data type conversions and validations
    spark_df = spark_df.withColumn("processed_timestamp", F.current_timestamp())
    
    # Add data quality metrics
    null_count = spark_df.filter(F.col("id").isNull()).count()
    duplicate_count = initial_count - spark_df.dropDuplicates(["id"]).count()
    
    logger.info(f"Data quality - Nulls: {{null_count}}, Duplicates: {{duplicate_count}}")
    
    # Custom transformations
    {self._generate_transformation_code(transformations)}
    
    # Convert back to DynamicFrame
    target_df = DynamicFrame.fromDF(spark_df, glueContext, "target_df")
    
    # Write to S3 in Parquet format with partitioning
    glueContext.write_dynamic_frame.from_options(
        frame=target_df,
        connection_type="s3",
        connection_options={{
            "path": args.get('target_s3_path', '{target_s3_path}'),
            "partitionKeys": ["year", "month", "day"]
        }},
        format="parquet",
        transformation_ctx="target_df"
    )
    
    final_count = target_df.count()
    logger.info(f"Successfully wrote {{final_count}} records to target")
    
    # Job metrics
    job_metrics = {{
        "source_records": initial_count,
        "target_records": final_count,
        "filtered_records": initial_count - final_count,
        "null_records": null_count,
        "duplicate_records": duplicate_count
    }}
    
    logger.info(f"Job metrics: {{job_metrics}}")

except Exception as e:
    logger.error(f"Job failed with error: {{str(e)}}")
    raise e

finally:
    job.commit()
    logger.info("Job completed successfully")
'''
        
        return script_template
    
    def _generate_transformation_code(self, transformations):
        """
        Generate transformation code based on configuration
        """
        if not transformations:
            return "# No additional transformations specified"
        
        transformation_code = ""
        
        for transform in transformations:
            if transform['type'] == 'filter':
                transformation_code += f"""
    # Filter: {transform['description']}
    spark_df = spark_df.filter({transform['condition']})
"""
            elif transform['type'] == 'column_rename':
                transformation_code += f"""
    # Rename column: {transform['old_name']} -> {transform['new_name']}
    spark_df = spark_df.withColumnRenamed('{transform['old_name']}', '{transform['new_name']}')
"""
            elif transform['type'] == 'derive_column':
                transformation_code += f"""
    # Derive column: {transform['column_name']}
    spark_df = spark_df.withColumn('{transform['column_name']}', {transform['expression']})
"""
            elif transform['type'] == 'aggregate':
                transformation_code += f"""
    # Aggregate data
    spark_df = spark_df.groupBy({transform['group_by']}).agg({transform['aggregations']})
"""
        
        return transformation_code
    
    def create_python_shell_script(self, source_s3_path, target_s3_path, 
                                   processing_logic=""):
        """
        Generate a Python shell script template
        """
        script_template = f'''
import sys
import boto3
import pandas as pd
import json
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AWS clients
s3 = boto3.client('s3')
glue = boto3.client('glue')

def main():
    try:
        source_path = "{source_s3_path}"
        target_path = "{target_s3_path}"
        
        logger.info(f"Starting Python shell job")
        logger.info(f"Source: {{source_path}}")
        logger.info(f"Target: {{target_path}}")
        
        # Read data from S3
        df = read_s3_data(source_path)
        logger.info(f"Read {{len(df)}} records from source")
        
        # Process data
        processed_df = process_data(df)
        logger.info(f"Processed {{len(processed_df)}} records")
        
        # Write to S3
        write_s3_data(processed_df, target_path)
        logger.info(f"Successfully wrote data to target")
        
    except Exception as e:
        logger.error(f"Job failed: {{str(e)}}")
        raise

def read_s3_data(s3_path):
    \"\"\"Read data from S3 using pandas\"\"\"
    # Parse S3 path
    bucket, key = parse_s3_path(s3_path)
    
    # Read CSV file
    obj = s3.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(obj['Body'])
    
    return df

def process_data(df):
    \"\"\"Process the data\"\"\"
    # Add processing timestamp
    df['processed_at'] = datetime.now().isoformat()
    
    # Custom processing logic
    {processing_logic}
    
    return df

def write_s3_data(df, s3_path):
    \"\"\"Write data to S3\"\"\"
    bucket, key = parse_s3_path(s3_path)
    
    # Convert to CSV and upload
    csv_buffer = df.to_csv(index=False)
    s3.put_object(Bucket=bucket, Key=key, Body=csv_buffer)

def parse_s3_path(s3_path):
    \"\"\"Parse S3 path into bucket and key\"\"\"
    path_parts = s3_path.replace('s3://', '').split('/', 1)
    bucket = path_parts[0]
    key = path_parts[1] if len(path_parts) > 1 else ''
    return bucket, key

if __name__ == '__main__':
    main()
'''
        
        return script_template
    
    def start_job_run(self, job_name, arguments=None, timeout=None, 
                      worker_type=None, number_of_workers=None):
        """
        Start a job run with custom parameters
        """
        try:
            job_run_config = {
                'JobName': job_name
            }
            
            if arguments:
                job_run_config['Arguments'] = arguments
            
            if timeout:
                job_run_config['Timeout'] = timeout
            
            if worker_type and number_of_workers:
                job_run_config['WorkerType'] = worker_type
                job_run_config['NumberOfWorkers'] = number_of_workers
            
            response = self.glue.start_job_run(**job_run_config)
            
            job_run_id = response['JobRunId']
            print(f"Job run started: {job_run_id}")
            return job_run_id
            
        except Exception as e:
            print(f"Error starting job run: {e}")
            return None
    
    def get_job_run_status(self, job_name, run_id):
        """
        Get job run status and metrics
        """
        try:
            response = self.glue.get_job_run(JobName=job_name, RunId=run_id)
            
            job_run = response['JobRun']
            
            status_info = {
                'job_name': job_name,
                'run_id': run_id,
                'state': job_run['JobRunState'],
                'started_on': job_run.get('StartedOn'),
                'completed_on': job_run.get('CompletedOn'),
                'execution_time': job_run.get('ExecutionTime'),
                'max_capacity': job_run.get('MaxCapacity'),
                'worker_type': job_run.get('WorkerType'),
                'number_of_workers': job_run.get('NumberOfWorkers'),
                'error_message': job_run.get('ErrorMessage')
            }
            
            return status_info
            
        except Exception as e:
            print(f"Error getting job run status: {e}")
            return None

# Usage examples
etl_manager = GlueETLManager()

# Define transformations
transformations = [
    {
        'type': 'filter',
        'description': 'Filter out test users',
        'condition': 'F.col("email").rlike("^(?!test@).*")'
    },
    {
        'type': 'column_rename',
        'old_name': 'reg_date',
        'new_name': 'registration_date'
    },
    {
        'type': 'derive_column',
        'column_name': 'age_group',
        'expression': 'F.when(F.col("age") < 25, "young").when(F.col("age") < 65, "adult").otherwise("senior")'
    }
]

# Create Spark ETL script
spark_script = etl_manager.create_spark_etl_script(
    'ecommerce_data',
    'raw_users',
    's3://my-data-lake/processed/users/',
    transformations
)

print("Generated Spark ETL Script:")
print(spark_script[:1000] + "...")  # Print first 1000 characters

# Upload script to S3
script_key = 'glue-scripts/user_processing_etl.py'
s3 = boto3.client('s3')
s3.put_object(
    Bucket='my-glue-scripts-bucket',
    Key=script_key,
    Body=spark_script
)

script_location = f's3://my-glue-scripts-bucket/{script_key}'

# Create ETL job
job_response = etl_manager.create_etl_job(
    'user-processing-etl',
    script_location,
    'arn:aws:iam::123456789012:role/GlueServiceRole',
    job_type='glueetl',
    worker_type='G.1X',
    number_of_workers=2,
    timeout=60  # 1 hour
)

# Start job run with custom arguments
if job_response:
    job_run_id = etl_manager.start_job_run(
        'user-processing-etl',
        arguments={
            '--source_database': 'ecommerce_data',
            '--source_table': 'raw_users',
            '--target_s3_path': 's3://my-data-lake/processed/users/'
        }
    )
    
    if job_run_id:
        # Check job status
        import time
        time.sleep(10)  # Wait a bit for job to start
        
        status = etl_manager.get_job_run_status('user-processing-etl', job_run_id)
        if status:
            print(f"Job Status: {status['state']}")
            print(f"Started: {status['started_on']}")
            if status['error_message']:
                print(f"Error: {status['error_message']}")

# Create Python shell script for simple data processing
python_processing_logic = '''
    # Remove duplicates
    df = df.drop_duplicates(subset=['user_id'])
    
    # Clean email addresses
    df['email'] = df['email'].str.lower().str.strip()
    
    # Add data quality flags
    df['has_valid_email'] = df['email'].str.contains('@', na=False)
    df['has_complete_profile'] = ~df[['user_id', 'email', 'registration_date']].isnull().any(axis=1)
'''

python_script = etl_manager.create_python_shell_script(
    's3://my-data-lake/raw/user_exports/users.csv',
    's3://my-data-lake/processed/clean_users.csv',
    python_processing_logic
)

print("Generated Python Shell Script:")
print(python_script[:500] + "...")  # Print first 500 characters
```

## Best Practices {#best-practices}

### AWS Glue Optimization and Operational Excellence

```python
class GlueBestPractices:
    def __init__(self):
        self.glue = boto3.client('glue')
        self.cloudwatch = boto3.client('cloudwatch')
    
    def implement_job_optimization_strategies(self):
        """
        Implement job optimization best practices
        """
        optimization_strategies = {
            'performance_optimization': {
                'partition_optimization': {
                    'description': 'Optimize data partitioning for better query performance',
                    'strategies': [
                        'Use date-based partitioning for time-series data',
                        'Limit partition count to 10,000-15,000 per table',
                        'Use partition projection for better query performance',
                        'Avoid small file problems with proper partition sizing'
                    ],
                    'example_code': '''
# Optimal partitioning example
glueContext.write_dynamic_frame.from_options(
    frame=transformed_df,
    connection_type="s3",
    connection_options={
        "path": "s3://my-bucket/data/",
        "partitionKeys": ["year", "month", "day"],
        "compression": "snappy"
    },
    format="parquet",
    transformation_ctx="write_partitioned_data"
)
'''
                },
                'worker_optimization': {
                    'description': 'Choose appropriate worker types and counts',
                    'guidelines': [
                        'G.1X: Small to medium datasets (< 100GB)',
                        'G.2X: Medium to large datasets (100GB - 1TB)',  
                        'G.4X: Very large datasets (> 1TB)',
                        'G.8X: Extremely large datasets with complex transformations',
                        'Start with minimum workers and scale based on performance'
                    ],
                    'auto_scaling_example': '''
# Enable auto scaling for variable workloads
job_config = {
    "WorkerType": "G.1X",
    "NumberOfWorkers": 2,
    "MaxCapacity": 10,  # Maximum DPUs for auto scaling
    "DefaultArguments": {
        "--enable-auto-scaling": "true",
        "--job-bookmark-option": "job-bookmark-enable"
    }
}
'''
                },
                'data_format_optimization': {
                    'description': 'Use optimal data formats for performance',
                    'recommendations': [
                        'Parquet: Best for analytics workloads',
                        'ORC: Good alternative to Parquet',
                        'Avro: Good for schema evolution',
                        'JSON: Use only for semi-structured data',
                        'Enable compression (Snappy, GZIP, LZO)'
                    ]
                }
            },
            'cost_optimization': {
                'job_bookmarks': {
                    'description': 'Use job bookmarks to process only new data',
                    'implementation': '''
# Enable job bookmarks in job arguments
"--job-bookmark-option": "job-bookmark-enable"

# In ETL script, use transformation_ctx for bookmark tracking
source_df = glueContext.create_dynamic_frame.from_catalog(
    database="my_database",
    table_name="my_table",
    transformation_ctx="source_df"  # Required for bookmarks
)
'''
                },
                'serverless_optimization': {
                    'description': 'Optimize for serverless execution',
                    'strategies': [
                        'Use Glue 4.0 for improved performance',
                        'Enable auto scaling',
                        'Use appropriate timeout values',
                        'Implement efficient data processing patterns'
                    ]
                },
                'resource_monitoring': {
                    'description': 'Monitor resource utilization for cost optimization',
                    'metrics_to_track': [
                        'DPU hours consumed',
                        'Job execution time',
                        'Data processed per hour',
                        'Failed job retry costs'
                    ]
                }
            },
            'reliability_patterns': {
                'error_handling': {
                    'description': 'Implement comprehensive error handling',
                    'pattern_example': '''
try:
    # Main ETL logic
    source_df = glueContext.create_dynamic_frame.from_catalog(...)
    transformed_df = apply_transformations(source_df)
    write_to_target(transformed_df)
    
    # Log success metrics
    logger.info(f"Successfully processed {transformed_df.count()} records")
    
except Exception as e:
    logger.error(f"Job failed with error: {str(e)}")
    
    # Send failure notification
    send_failure_notification(str(e))
    
    # Write error records to separate location for analysis
    error_df = create_error_record(e, source_data)
    write_error_records(error_df)
    
    raise e
'''
                },
                'data_validation': {
                    'description': 'Implement data quality checks',
                    'validation_example': '''
def validate_data_quality(df, validation_rules):
    """Implement comprehensive data validation"""
    
    validation_results = {}
    
    # Check for null values in critical columns
    for column in validation_rules.get('required_columns', []):
        null_count = df.filter(F.col(column).isNull()).count()
        validation_results[f'{column}_null_count'] = null_count
        
        if null_count > 0:
            logger.warning(f"Found {null_count} null values in {column}")
    
    # Check data ranges
    for column, range_check in validation_rules.get('range_checks', {}).items():
        out_of_range = df.filter(
            (F.col(column) < range_check['min']) | 
            (F.col(column) > range_check['max'])
        ).count()
        
        validation_results[f'{column}_out_of_range'] = out_of_range
    
    # Check for duplicates
    total_count = df.count()
    unique_count = df.dropDuplicates(validation_rules.get('unique_columns', [])).count()
    duplicate_count = total_count - unique_count
    
    validation_results['duplicate_count'] = duplicate_count
    
    return validation_results
'''
                },
                'retry_mechanisms': {
                    'description': 'Implement intelligent retry strategies',
                    'configuration': {
                        'max_retries': 2,
                        'retry_delay': 300,  # 5 minutes
                        'exponential_backoff': True
                    }
                }
            }
        }
        
        return optimization_strategies
    
    def setup_comprehensive_monitoring(self, job_names):
        """
        Set up comprehensive monitoring for Glue jobs
        """
        monitoring_setup = {
            'cloudwatch_metrics': self._setup_cloudwatch_alarms(job_names),
            'custom_metrics': self._setup_custom_metrics(),
            'logging_configuration': self._setup_logging_best_practices(),
            'notification_setup': self._setup_notifications()
        }
        
        return monitoring_setup
    
    def _setup_cloudwatch_alarms(self, job_names):
        """
        Create CloudWatch alarms for Glue jobs
        """
        alarms_created = []
        
        for job_name in job_names:
            # Job failure alarm
            try:
                self.cloudwatch.put_metric_alarm(
                    AlarmName=f'GlueJob-{job_name}-Failures',
                    ComparisonOperator='GreaterThanThreshold',
                    EvaluationPeriods=1,
                    MetricName='glue.driver.aggregate.numFailedTasks',
                    Namespace='AWS/Glue',
                    Period=300,
                    Statistic='Sum',
                    Threshold=0.0,
                    ActionsEnabled=True,
                    AlarmActions=[
                        'arn:aws:sns:us-east-1:123456789012:glue-job-failures'
                    ],
                    AlarmDescription=f'Alert when Glue job {job_name} fails',
                    Dimensions=[
                        {
                            'Name': 'JobName',
                            'Value': job_name
                        }
                    ]
                )
                alarms_created.append(f'GlueJob-{job_name}-Failures')
                
                # Long running job alarm
                self.cloudwatch.put_metric_alarm(
                    AlarmName=f'GlueJob-{job_name}-LongRunning',
                    ComparisonOperator='GreaterThanThreshold',
                    EvaluationPeriods=1,
                    MetricName='glue.driver.ExecutorAllocationManager.executors.numberAllExecutors',
                    Namespace='AWS/Glue',
                    Period=3600,  # 1 hour
                    Statistic='Average',
                    Threshold=0.0,
                    ActionsEnabled=True,
                    AlarmActions=[
                        'arn:aws:sns:us-east-1:123456789012:glue-job-performance'
                    ],
                    AlarmDescription=f'Alert when Glue job {job_name} runs longer than expected',
                    Dimensions=[
                        {
                            'Name': 'JobName',
                            'Value': job_name
                        }
                    ]
                )
                alarms_created.append(f'GlueJob-{job_name}-LongRunning')
                
            except Exception as e:
                print(f"Error creating alarm for {job_name}: {e}")
        
        return alarms_created
    
    def _setup_custom_metrics(self):
        """
        Set up custom metrics for job monitoring
        """
        custom_metrics_code = '''
import boto3
from datetime import datetime

def publish_custom_metrics(job_name, metrics_data):
    """Publish custom metrics to CloudWatch"""
    cloudwatch = boto3.client('cloudwatch')
    
    metric_data = []
    
    for metric_name, value in metrics_data.items():
        metric_data.append({
            'MetricName': metric_name,
            'Value': value,
            'Unit': 'Count',
            'Dimensions': [
                {
                    'Name': 'JobName',
                    'Value': job_name
                }
            ],
            'Timestamp': datetime.utcnow()
        })
    
    try:
        cloudwatch.put_metric_data(
            Namespace='Glue/CustomMetrics',
            MetricData=metric_data
        )
    except Exception as e:
        logger.error(f"Failed to publish custom metrics: {e}")

# Example usage in ETL job
def main_etl_logic():
    # ... ETL processing ...
    
    # Collect custom metrics
    job_metrics = {
        'RecordsProcessed': processed_count,
        'RecordsFiltered': filtered_count,
        'DataQualityScore': calculate_quality_score(),
        'ProcessingRate': processed_count / execution_time
    }
    
    publish_custom_metrics('my-etl-job', job_metrics)
'''
        
        return custom_metrics_code
    
    def _setup_logging_best_practices(self):
        """
        Logging configuration best practices
        """
        logging_config = {
            'job_arguments': {
                '--enable-continuous-cloudwatch-log': 'true',
                '--enable-metrics': '',
                '--additional-python-modules': 'requests,pandas==1.5.3'
            },
            'logging_code_example': '''
import logging
from awsglue.context import GlueContext

# Set up structured logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create formatter for structured logs
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def log_job_progress(stage, records_processed=0, additional_info=None):
    """Log job progress with structured information"""
    log_data = {
        'stage': stage,
        'timestamp': datetime.utcnow().isoformat(),
        'records_processed': records_processed
    }
    
    if additional_info:
        log_data.update(additional_info)
    
    logger.info(json.dumps(log_data))

# Usage examples
log_job_progress('data_extraction', records_processed=1000)
log_job_progress('data_transformation', 
                records_processed=950, 
                additional_info={'filtered_records': 50})
log_job_progress('data_loading', records_processed=950)
''',
            'log_retention': {
                'description': 'Set appropriate log retention periods',
                'recommendation': '30 days for development, 90 days for production'
            }
        }
        
        return logging_config
    
    def _setup_notifications(self):
        """
        Set up notification systems for job events
        """
        notification_setup = {
            'sns_topics': [
                {
                    'name': 'glue-job-failures',
                    'description': 'Critical job failures requiring immediate attention'
                },
                {
                    'name': 'glue-job-performance',
                    'description': 'Performance issues and long-running jobs'
                },
                {
                    'name': 'glue-data-quality',
                    'description': 'Data quality issues and validation failures'
                }
            ],
            'slack_integration': '''
import json
import urllib3

def send_slack_notification(webhook_url, message, channel='#data-engineering'):
    """Send notification to Slack"""
    http = urllib3.PoolManager()
    
    slack_message = {
        'channel': channel,
        'username': 'AWS Glue',
        'text': message,
        'icon_emoji': ':warning:'
    }
    
    try:
        response = http.request(
            'POST',
            webhook_url,
            body=json.dumps(slack_message),
            headers={'Content-Type': 'application/json'}
        )
        return response.status == 200
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}")
        return False
''',
            'email_templates': {
                'job_failure': {
                    'subject': 'AWS Glue Job Failure: {job_name}',
                    'body': '''
Job Name: {job_name}
Run ID: {run_id}
Error: {error_message}
Started: {start_time}
Failed: {end_time}
Duration: {duration}

Please investigate and resolve the issue.
'''
                }
            }
        }
        
        return notification_setup
    
    def implement_security_best_practices(self):
        """
        Implement security best practices for Glue jobs
        """
        security_practices = {
            'iam_policies': {
                'principle_of_least_privilege': '''
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::my-data-bucket/input/*",
                "arn:aws:s3:::my-data-bucket/output/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "glue:GetTable",
                "glue:GetPartitions"
            ],
            "Resource": [
                "arn:aws:glue:*:*:catalog",
                "arn:aws:glue:*:*:database/my_database",
                "arn:aws:glue:*:*:table/my_database/*"
            ]
        }
    ]
}
''',
                'cross_account_access': '''
# For cross-account access, use AssumeRole
{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": "arn:aws:iam::TARGET-ACCOUNT:role/CrossAccountGlueRole",
    "Condition": {
        "StringEquals": {
            "sts:ExternalId": "unique-external-id"
        }
    }
}
'''
            },
            'data_encryption': {
                'at_rest': {
                    'description': 'Encrypt data at rest using KMS',
                    'configuration': {
                        's3_encryption': 'AES256 or aws:kms',
                        'glue_catalog_encryption': 'Enabled with KMS key',
                        'job_bookmark_encryption': 'Enabled'
                    }
                },
                'in_transit': {
                    'description': 'Enable SSL/TLS for all connections',
                    'jdbc_connections': 'Use SSL connection strings',
                    'api_calls': 'All AWS API calls use TLS 1.2'
                }
            },
            'network_security': {
                'vpc_configuration': {
                    'description': 'Run Glue jobs in VPC for network isolation',
                    'requirements': [
                        'Private subnets for Glue jobs',
                        'NAT Gateway for internet access',
                        'VPC endpoints for AWS services',
                        'Security groups with minimal permissions'
                    ]
                },
                'endpoint_security': {
                    'vpc_endpoints': [
                        'com.amazonaws.region.s3',
                        'com.amazonaws.region.glue',
                        'com.amazonaws.region.logs'
                    ]
                }
            },
            'secrets_management': {
                'database_credentials': '''
import boto3
from botocore.exceptions import ClientError

def get_secret(secret_name, region_name="us-east-1"):
    """Retrieve database credentials from AWS Secrets Manager"""
    session = boto3.session.Session()
    client = session.client('secretsmanager', region_name=region_name)
    
    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except ClientError as e:
        logger.error(f"Failed to retrieve secret {secret_name}: {e}")
        raise

# Usage in Glue job
db_credentials = get_secret('prod/database/credentials')
connection_options = {
    "url": f"jdbc:postgresql://host:5432/db",
    "user": db_credentials['username'],
    "password": db_credentials['password']
}
'''
            }
        }
        
        return security_practices

# Best practices implementation
best_practices = GlueBestPractices()

# Get optimization strategies
optimization_strategies = best_practices.implement_job_optimization_strategies()
print("Glue Job Optimization Strategies:")
print(json.dumps(optimization_strategies, indent=2, default=str))

# Set up monitoring for jobs
monitoring_setup = best_practices.setup_comprehensive_monitoring(['user-processing-etl', 'order-aggregation-etl'])
print(f"\nMonitoring setup completed. Alarms created: {len(monitoring_setup['cloudwatch_metrics'])}")

# Get security best practices
security_practices = best_practices.implement_security_best_practices()
print("\nSecurity Best Practices:")
print(json.dumps(security_practices, indent=2))
```

## Cost Optimization {#cost-optimization}

### Glue Cost Management

```python
class GlueCostOptimizer:
    def __init__(self):
        self.glue = boto3.client('glue')
        self.ce = boto3.client('ce')  # Cost Explorer
        self.cloudwatch = boto3.client('cloudwatch')
    
    def analyze_glue_costs(self, start_date, end_date):
        """
        Analyze AWS Glue costs and usage patterns
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
                        'Key': 'USAGE_TYPE'
                    }
                ],
                Filter={
                    'Dimensions': {
                        'Key': 'SERVICE',
                        'Values': ['AWS Glue']
                    }
                }
            )
            
            cost_breakdown = {}
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    usage_type = group['Keys'][0]
                    cost = float(group['Metrics']['BlendedCost']['Amount'])
                    usage = float(group['Metrics']['UsageQuantity']['Amount'])
                    
                    if usage_type not in cost_breakdown:
                        cost_breakdown[usage_type] = {'cost': 0, 'usage': 0}
                    
                    cost_breakdown[usage_type]['cost'] += cost
                    cost_breakdown[usage_type]['usage'] += usage
            
            return cost_breakdown
            
        except Exception as e:
            print(f"Error analyzing Glue costs: {e}")
            return {}
    
    def optimize_job_configurations(self):
        """
        Analyze job configurations and provide optimization recommendations
        """
        try:
            jobs = self.glue.get_jobs()
            
            optimization_recommendations = []
            
            for job in jobs['Jobs']:
                job_name = job['Name']
                recommendations = []
                current_cost_estimate = 0
                
                # Analyze worker configuration
                worker_type = job.get('WorkerType', 'Standard')
                number_of_workers = job.get('NumberOfWorkers', 2)
                max_capacity = job.get('MaxCapacity', 2)
                
                # Calculate approximate hourly cost
                worker_costs = {
                    'Standard': 0.44,    # $0.44 per DPU hour
                    'G.1X': 0.44,        # $0.44 per DPU hour  
                    'G.2X': 0.88,        # $0.88 per DPU hour
                    'G.4X': 1.76,        # $1.76 per DPU hour
                    'G.8X': 3.52         # $3.52 per DPU hour
                }
                
                if worker_type in worker_costs:
                    hourly_cost = worker_costs[worker_type] * number_of_workers
                else:
                    hourly_cost = 0.44 * max_capacity  # Fallback to DPU pricing
                
                current_cost_estimate = hourly_cost
                
                # Check for over-provisioning
                if worker_type == 'G.8X' and number_of_workers > 2:
                    recommendations.append({
                        'type': 'worker_optimization',
                        'description': 'Consider using smaller worker types with more workers',
                        'potential_savings': hourly_cost * 0.3,
                        'action': 'Try G.2X with more workers for better cost efficiency'
                    })
                
                # Check timeout settings
                timeout = job.get('Timeout', 2880)  # Default 48 hours
                if timeout > 720:  # More than 12 hours
                    recommendations.append({
                        'type': 'timeout_optimization', 
                        'description': f'Long timeout setting: {timeout} minutes',
                        'potential_savings': 'Prevent runaway job costs',
                        'action': 'Review and optimize job logic, reduce timeout'
                    })
                
                # Check retry configuration
                max_retries = job.get('MaxRetries', 0)
                if max_retries > 2:
                    recommendations.append({
                        'type': 'retry_optimization',
                        'description': f'High retry count: {max_retries}',
                        'potential_savings': hourly_cost * max_retries * 0.5,
                        'action': 'Implement better error handling, reduce retries'
                    })
                
                # Check for job bookmark usage
                default_args = job.get('DefaultArguments', {})
                bookmark_option = default_args.get('--job-bookmark-option', 'job-bookmark-disable')
                
                if bookmark_option == 'job-bookmark-disable':
                    recommendations.append({
                        'type': 'bookmark_optimization',
                        'description': 'Job bookmarks not enabled',
                        'potential_savings': hourly_cost * 0.7,  # Significant savings
                        'action': 'Enable job bookmarks to process only new data'
                    })
                
                if recommendations:
                    total_potential_savings = sum(
                        r.get('potential_savings', 0) for r in recommendations 
                        if isinstance(r.get('potential_savings'), (int, float))
                    )
                    
                    optimization_recommendations.append({
                        'job_name': job_name,
                        'current_hourly_cost': hourly_cost,
                        'worker_type': worker_type,
                        'number_of_workers': number_of_workers,
                        'recommendations': recommendations,
                        'total_potential_hourly_savings': total_potential_savings
                    })
            
            return optimization_recommendations
            
        except Exception as e:
            print(f"Error optimizing job configurations: {e}")
            return []
    
    def analyze_crawler_costs(self):
        """
        Analyze crawler costs and usage patterns
        """
        try:
            crawlers = self.glue.get_crawlers()
            
            crawler_analysis = []
            
            for crawler in crawlers['Crawlers']:
                crawler_name = crawler['Name']
                
                # Get crawler metrics
                try:
                    metrics = self.glue.get_crawler_metrics(CrawlerNameList=[crawler_name])
                    crawler_metrics = metrics['CrawlerMetricsList'][0] if metrics['CrawlerMetricsList'] else {}
                    
                    # Calculate approximate costs
                    last_runtime_seconds = crawler_metrics.get('LastRuntimeSeconds', 0)
                    runtime_hours = last_runtime_seconds / 3600
                    
                    # Crawler pricing: $0.44 per DPU hour
                    estimated_cost_per_run = runtime_hours * 0.44
                    
                    # Check schedule
                    schedule = crawler.get('Schedule', {}).get('ScheduleExpression', 'On demand')
                    
                    recommendations = []
                    
                    # Check for frequent scheduling
                    if 'cron' in schedule.lower() and ('hour' in schedule.lower() or 'minute' in schedule.lower()):
                        recommendations.append({
                            'type': 'schedule_optimization',
                            'description': 'Frequent crawler schedule detected',
                            'action': 'Consider less frequent scheduling or event-driven crawling'
                        })
                    
                    # Check for long runtime
                    if last_runtime_seconds > 3600:  # More than 1 hour
                        recommendations.append({
                            'type': 'runtime_optimization',
                            'description': f'Long crawler runtime: {runtime_hours:.2f} hours',
                            'action': 'Optimize crawler targets and exclusion patterns'
                        })
                    
                    crawler_analysis.append({
                        'crawler_name': crawler_name,
                        'last_runtime_hours': runtime_hours,
                        'estimated_cost_per_run': estimated_cost_per_run,
                        'schedule': schedule,
                        'tables_created': crawler_metrics.get('TablesCreated', 0),
                        'tables_updated': crawler_metrics.get('TablesUpdated', 0),
                        'recommendations': recommendations
                    })
                
                except Exception as e:
                    print(f"Error getting metrics for crawler {crawler_name}: {e}")
            
            return crawler_analysis
            
        except Exception as e:
            print(f"Error analyzing crawler costs: {e}")
            return []
    
    def calculate_cost_projections(self, job_usage_patterns):
        """
        Calculate cost projections for different usage patterns
        """
        pricing = {
            'glue_etl': {
                'Standard': 0.44,    # $ per DPU hour
                'G.1X': 0.44,        # $ per DPU hour
                'G.2X': 0.88,        # $ per DPU hour
                'G.4X': 1.76,        # $ per DPU hour
                'G.8X': 3.52,        # $ per DPU hour
                'G.025X': 0.44       # $ per DPU hour (Python shell)
            },
            'glue_crawler': 0.44,    # $ per DPU hour
            'glue_catalog': {
                'first_million_requests': 0.0,      # Free
                'additional_requests': 1.0,         # $ per million requests
                'storage': 0.0                      # Free
            },
            'glue_studio': 0.0,      # No additional cost
            'glue_databrew': {
                'node_hour': 0.48,                  # $ per node hour
                'first_30_datasets': 0.0,           # Free
                'additional_datasets': 1.0          # $ per dataset per month
            }
        }
        
        projections = {}
        
        for job_name, pattern in job_usage_patterns.items():
            worker_type = pattern.get('worker_type', 'G.1X')
            number_of_workers = pattern.get('number_of_workers', 2)
            hours_per_month = pattern.get('hours_per_month', 0)
            
            # Calculate monthly cost
            hourly_cost = pricing['glue_etl'][worker_type] * number_of_workers
            monthly_cost = hourly_cost * hours_per_month
            
            # Calculate cost with different optimizations
            optimized_scenarios = {}
            
            # Scenario 1: Enable job bookmarks (70% reduction in processing time)
            bookmark_hours = hours_per_month * 0.3
            bookmark_cost = hourly_cost * bookmark_hours
            optimized_scenarios['with_bookmarks'] = {
                'monthly_cost': bookmark_cost,
                'savings': monthly_cost - bookmark_cost,
                'description': 'Enable job bookmarks to process only new data'
            }
            
            # Scenario 2: Right-size workers (switch to smaller/larger workers)
            if worker_type == 'G.2X' and number_of_workers >= 4:
                alt_cost = pricing['glue_etl']['G.1X'] * (number_of_workers * 2) * hours_per_month
                optimized_scenarios['right_sized_workers'] = {
                    'monthly_cost': alt_cost,
                    'savings': monthly_cost - alt_cost if alt_cost < monthly_cost else 0,
                    'description': f'Use G.1X workers instead of {worker_type}'
                }
            
            # Scenario 3: Optimize runtime (assume 20% improvement)
            optimized_hours = hours_per_month * 0.8
            runtime_optimized_cost = hourly_cost * optimized_hours
            optimized_scenarios['runtime_optimization'] = {
                'monthly_cost': runtime_optimized_cost,
                'savings': monthly_cost - runtime_optimized_cost,
                'description': 'Optimize job logic and data processing'
            }
            
            projections[job_name] = {
                'current_monthly_cost': monthly_cost,
                'current_hourly_cost': hourly_cost,
                'hours_per_month': hours_per_month,
                'worker_configuration': f"{worker_type} x {number_of_workers}",
                'optimization_scenarios': optimized_scenarios,
                'best_optimization': max(
                    optimized_scenarios.items(),
                    key=lambda x: x[1]['savings']
                )[0] if optimized_scenarios else None
            }
        
        return projections
    
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
            'current_costs': self.analyze_glue_costs(start_date, end_date),
            'job_optimizations': self.optimize_job_configurations(),
            'crawler_analysis': self.analyze_crawler_costs(),
            'recommendations_summary': {
                'immediate_actions': [
                    'Enable job bookmarks for incremental processing',
                    'Right-size worker types based on data volume',
                    'Optimize crawler schedules and reduce frequency',
                    'Implement proper timeout settings'
                ],
                'cost_reduction_strategies': [
                    'Use partition projection for better query performance',
                    'Implement data lifecycle policies for staging data',
                    'Optimize data formats (use Parquet with compression)',
                    'Consolidate small files to reduce processing overhead'
                ]
            }
        }
        
        # Calculate total potential savings
        total_job_savings = 0
        for job_opt in report['job_optimizations']:
            total_job_savings += job_opt.get('total_potential_hourly_savings', 0)
        
        # Estimate monthly savings (assuming 20 hours average monthly execution)
        estimated_monthly_savings = total_job_savings * 20
        
        report['cost_summary'] = {
            'total_potential_hourly_savings': total_job_savings,
            'estimated_monthly_savings': estimated_monthly_savings,
            'estimated_annual_savings': estimated_monthly_savings * 12
        }
        
        return report

# Cost optimization examples
cost_optimizer = GlueCostOptimizer()

# Example job usage patterns for cost projection
job_usage_patterns = {
    'daily-user-etl': {
        'worker_type': 'G.1X',
        'number_of_workers': 2,
        'hours_per_month': 30  # 1 hour daily
    },
    'weekly-sales-aggregation': {
        'worker_type': 'G.2X', 
        'number_of_workers': 4,
        'hours_per_month': 16  # 4 hours weekly
    },
    'real-time-processing': {
        'worker_type': 'G.1X',
        'number_of_workers': 1,
        'hours_per_month': 720  # Always running
    }
}

# Calculate cost projections
projections = cost_optimizer.calculate_cost_projections(job_usage_patterns)
print("Glue Cost Projections:")
for job_name, projection in projections.items():
    print(f"\n{job_name}:")
    print(f"  Current monthly cost: ${projection['current_monthly_cost']:.2f}")
    print(f"  Worker config: {projection['worker_configuration']}")
    
    if projection['best_optimization']:
        best_opt = projection['optimization_scenarios'][projection['best_optimization']]
        print(f"  Best optimization: {projection['best_optimization']}")
        print(f"  Potential monthly savings: ${best_opt['savings']:.2f}")

# Generate comprehensive cost optimization report
report = cost_optimizer.generate_cost_optimization_report()
print(f"\nGlue Cost Optimization Report:")
print(f"Estimated Monthly Savings: ${report['cost_summary']['estimated_monthly_savings']:.2f}")
print(f"Estimated Annual Savings: ${report['cost_summary']['estimated_annual_savings']:.2f}")

print(f"\nTop Recommendations:")
for rec in report['recommendations_summary']['immediate_actions']:
    print(f"  - {rec}")
```

## Conclusion

AWS Glue provides a comprehensive serverless platform for data integration, cataloging, and ETL processing. Key takeaways:

### Essential Components:
- **Data Catalog**: Centralized metadata repository for data discovery and governance
- **Crawlers**: Automated schema discovery and cataloging from various data sources
- **ETL Jobs**: Flexible data transformation with Apache Spark and Python
- **Glue Studio**: Visual interface for building and monitoring ETL workflows

### Advanced Capabilities:
- **Multiple job types**: Spark ETL, Python Shell, and Ray for different use cases
- **Serverless execution**: Auto-scaling with pay-per-use pricing model
- **Schema evolution**: Automatic handling of schema changes and versioning
- **Integration ecosystem**: Seamless integration with AWS analytics services
- **Data quality**: Built-in data validation and quality checking capabilities

### Best Practices:
- Implement effective partitioning strategies for optimal performance
- Use job bookmarks for incremental data processing
- Set up comprehensive monitoring and alerting
- Implement proper error handling and retry mechanisms
- Follow security best practices with IAM, encryption, and VPC configuration
- Optimize worker types and counts based on data volume and complexity

### Cost Optimization Strategies:
- Enable job bookmarks to process only new/changed data (up to 70% cost reduction)
- Right-size worker types based on actual processing requirements
- Optimize crawler schedules and use incremental crawling patterns
- Use appropriate data formats (Parquet with compression) for better performance
- Implement proper timeout settings to prevent runaway costs
- Monitor and optimize job execution times regularly

### Operational Excellence:
- Use infrastructure as code for job and crawler deployment
- Implement comprehensive logging and monitoring strategies
- Set up automated data quality validation
- Maintain proper documentation and data lineage
- Regular cost reviews and optimization cycles
- Disaster recovery and backup strategies for metadata

AWS Glue enables organizations to build scalable, cost-effective data processing pipelines while reducing the operational overhead of managing infrastructure, making it ideal for modern data lakes and analytics workloads.