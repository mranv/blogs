---
title: "The Complete Guide to Amazon ElastiCache: Redis and Memcached In-Memory Caching"
description: "Master Amazon ElastiCache with this comprehensive guide covering Redis and Memcached deployment, optimization, high availability, and advanced caching patterns."
publishDate: 2024-12-09
author: "Anubhav Gain"
category: "Cloud Computing"
tags:
  - aws
  - elasticache
  - redis
  - memcached
  - caching
  - in-memory
  - performance
  - database
  - scaling
featured: true
draft: false
slug: "complete-guide-amazon-elasticache-caching"
---

# The Complete Guide to Amazon ElastiCache: Redis and Memcached In-Memory Caching

Amazon ElastiCache is AWS's fully managed in-memory caching service that supports both Redis and Memcached engines. This comprehensive guide covers deployment strategies, optimization techniques, high availability configurations, and advanced caching patterns.

## Table of Contents
1. [Introduction to ElastiCache](#introduction)
2. [Redis vs Memcached](#redis-vs-memcached)
3. [Cluster Architecture and Design](#cluster-architecture)
4. [Redis Deployment Patterns](#redis-deployment)
5. [Memcached Implementation](#memcached-implementation)
6. [Security and Access Control](#security)
7. [Monitoring and Performance Tuning](#monitoring-performance)
8. [High Availability and Disaster Recovery](#high-availability)
9. [Application Integration Patterns](#application-integration)
10. [Best Practices](#best-practices)
11. [Cost Optimization](#cost-optimization)
12. [Troubleshooting](#troubleshooting)

## Introduction to ElastiCache {#introduction}

Amazon ElastiCache is a fully managed in-memory data store service that improves application performance by retrieving data from high-speed, managed, in-memory data stores instead of relying on slower disk-based databases.

### Key Benefits:
- **Sub-millisecond latency**: Extremely fast data access
- **Fully managed**: AWS handles infrastructure, maintenance, and patching
- **Scalable**: Easy horizontal and vertical scaling
- **Highly available**: Multi-AZ deployments with automatic failover
- **Cost-effective**: Reduce database load and improve performance

### Use Cases:
- Database query result caching
- Session storage for web applications
- Real-time analytics and leaderboards
- Message queuing and pub/sub
- Content delivery acceleration
- Gaming and social applications

## Redis vs Memcached {#redis-vs-memcached}

```python
import boto3
import json
from datetime import datetime

def compare_engines():
    """
    Compare Redis and Memcached engines for different use cases
    """
    comparison = {
        "redis": {
            "description": "Advanced in-memory data structure store",
            "strengths": [
                "Rich data structures (strings, hashes, lists, sets, sorted sets)",
                "Persistence options (RDB snapshots, AOF logging)",
                "Pub/Sub messaging",
                "Lua scripting support",
                "Atomic operations and transactions",
                "Geospatial indexes",
                "Built-in replication",
                "Cluster mode for horizontal scaling"
            ],
            "ideal_use_cases": [
                "Session storage with complex data",
                "Real-time analytics and counting",
                "Message queues and pub/sub",
                "Gaming leaderboards",
                "Geospatial applications",
                "Machine learning model serving"
            ],
            "node_types": [
                "cache.t3.micro - cache.t3.2xlarge",
                "cache.r6g.large - cache.r6g.12xlarge", 
                "cache.r5.large - cache.r5.24xlarge"
            ],
            "max_cluster_size": "500 nodes (cluster mode enabled)",
            "persistence": "Yes (RDB + AOF)",
            "replication": "Yes (up to 5 read replicas)"
        },
        "memcached": {
            "description": "Simple, high-performance distributed memory object caching system",
            "strengths": [
                "Simple key-value operations",
                "Multi-threaded architecture",
                "Lower memory overhead",
                "Easy horizontal scaling",
                "Fast serialization/deserialization",
                "Simple protocol"
            ],
            "ideal_use_cases": [
                "Simple caching of database query results",
                "Web page caching",
                "Object caching",
                "Simple session storage",
                "Content delivery acceleration"
            ],
            "node_types": [
                "cache.t3.micro - cache.t3.2xlarge",
                "cache.r6g.large - cache.r6g.12xlarge",
                "cache.r5.large - cache.r5.24xlarge"
            ],
            "max_cluster_size": "300 nodes",
            "persistence": "No",
            "replication": "No (use consistent hashing)"
        }
    }
    
    return comparison

# Initialize ElastiCache client
elasticache = boto3.client('elasticache')

def get_supported_engines():
    """
    Get supported cache engine versions
    """
    try:
        # Get Redis engine versions
        redis_versions = elasticache.describe_cache_engine_versions(
            Engine='redis'
        )
        
        # Get Memcached engine versions  
        memcached_versions = elasticache.describe_cache_engine_versions(
            Engine='memcached'
        )
        
        return {
            'redis_versions': [v['EngineVersion'] for v in redis_versions['CacheEngineVersions']],
            'memcached_versions': [v['EngineVersion'] for v in memcached_versions['CacheEngineVersions']]
        }
        
    except Exception as e:
        print(f"Error getting engine versions: {e}")
        return {}

print("ElastiCache Engine Comparison:")
print(json.dumps(compare_engines(), indent=2))

engine_versions = get_supported_engines()
print(f"\nSupported Redis versions: {engine_versions.get('redis_versions', [])[:5]}...")
print(f"Supported Memcached versions: {engine_versions.get('memcached_versions', [])[:5]}...")
```

## Cluster Architecture and Design {#cluster-architecture}

### Understanding ElastiCache Architectures

```python
class ElastiCacheArchitecture:
    def __init__(self):
        self.elasticache = boto3.client('elasticache')
    
    def design_redis_cluster_architecture(self, use_case, data_size_gb, read_write_ratio):
        """
        Design optimal Redis cluster architecture based on requirements
        """
        architectures = {
            "simple_cache": {
                "description": "Single Redis node for simple caching",
                "configuration": {
                    "cluster_mode": False,
                    "replication": False,
                    "node_type": "cache.r6g.large",
                    "num_nodes": 1
                },
                "use_cases": ["Development", "Small applications", "Budget-conscious deployments"],
                "limitations": ["No high availability", "Single point of failure", "Limited scaling"]
            },
            "high_availability": {
                "description": "Redis with replication for high availability",
                "configuration": {
                    "cluster_mode": False,
                    "replication": True,
                    "node_type": "cache.r6g.large",
                    "num_cache_nodes": 2,  # 1 primary + 1 replica
                    "multi_az": True,
                    "automatic_failover": True
                },
                "use_cases": ["Production applications", "Session storage", "Critical caching"],
                "benefits": ["Automatic failover", "Read scaling", "Data persistence"]
            },
            "horizontal_scaling": {
                "description": "Redis Cluster Mode for horizontal scaling",
                "configuration": {
                    "cluster_mode": True,
                    "replication": True,
                    "node_type": "cache.r6g.xlarge",
                    "num_node_groups": 3,  # Shards
                    "replicas_per_node_group": 2,
                    "multi_az": True
                },
                "use_cases": ["Large datasets", "High throughput", "Massive scale applications"],
                "benefits": ["Horizontal scaling", "High availability", "Data partitioning"]
            },
            "global_datastore": {
                "description": "Global Redis for cross-region replication",
                "configuration": {
                    "cluster_mode": True,
                    "replication": True,
                    "global_replication": True,
                    "primary_region": "us-east-1",
                    "secondary_regions": ["us-west-2", "eu-west-1"],
                    "node_type": "cache.r6g.2xlarge"
                },
                "use_cases": ["Global applications", "Disaster recovery", "Low-latency global access"],
                "benefits": ["Global replication", "Disaster recovery", "Reduced latency"]
            }
        }
        
        # Recommend architecture based on requirements
        if data_size_gb < 5 and read_write_ratio < 10:
            recommended = "simple_cache"
        elif data_size_gb < 50 and read_write_ratio < 100:
            recommended = "high_availability"
        elif data_size_gb < 500:
            recommended = "horizontal_scaling"
        else:
            recommended = "global_datastore"
        
        return {
            "recommended_architecture": recommended,
            "architecture_details": architectures[recommended],
            "all_options": architectures
        }
    
    def calculate_memory_requirements(self, data_types, estimated_items):
        """
        Calculate memory requirements for different Redis data types
        """
        memory_overhead = {
            "string": 56,      # bytes overhead per string key-value
            "hash": 64,        # bytes overhead per hash
            "list": 48,        # bytes overhead per list
            "set": 48,         # bytes overhead per set
            "zset": 64,        # bytes overhead per sorted set
            "json": 72         # bytes overhead per JSON document
        }
        
        memory_calculation = {}
        total_memory_mb = 0
        
        for data_type, items_config in data_types.items():
            avg_key_size = items_config.get('avg_key_size', 20)
            avg_value_size = items_config.get('avg_value_size', 100)
            item_count = estimated_items.get(data_type, 0)
            
            overhead = memory_overhead.get(data_type, 56)
            memory_per_item = overhead + avg_key_size + avg_value_size
            total_type_memory = (memory_per_item * item_count) / (1024 * 1024)  # MB
            
            memory_calculation[data_type] = {
                'item_count': item_count,
                'memory_per_item_bytes': memory_per_item,
                'total_memory_mb': total_type_memory
            }
            
            total_memory_mb += total_type_memory
        
        # Add Redis overhead (20-30% of data size)
        redis_overhead = total_memory_mb * 0.25
        total_with_overhead = total_memory_mb + redis_overhead
        
        # Recommend node type based on memory requirements
        node_recommendations = []
        node_types = {
            'cache.r6g.large': 13.07,      # GB RAM
            'cache.r6g.xlarge': 26.32,     # GB RAM
            'cache.r6g.2xlarge': 52.82,    # GB RAM
            'cache.r6g.4xlarge': 105.81,   # GB RAM
            'cache.r6g.12xlarge': 317.77   # GB RAM
        }
        
        total_gb = total_with_overhead / 1024
        for node_type, ram_gb in node_types.items():
            if ram_gb >= total_gb * 1.2:  # 20% buffer
                node_recommendations.append({
                    'node_type': node_type,
                    'ram_gb': ram_gb,
                    'utilization': f"{(total_gb / ram_gb) * 100:.1f}%"
                })
        
        return {
            'data_breakdown': memory_calculation,
            'total_data_memory_mb': total_memory_mb,
            'redis_overhead_mb': redis_overhead,
            'total_memory_required_mb': total_with_overhead,
            'total_memory_required_gb': total_gb,
            'recommended_nodes': node_recommendations[:3]  # Top 3 recommendations
        }
    
    def design_memcached_cluster(self, expected_connections, memory_requirements_gb):
        """
        Design Memcached cluster based on requirements
        """
        # Memcached architectures
        architectures = {
            "single_node": {
                "description": "Single Memcached node",
                "node_count": 1,
                "use_case": "Small applications, development",
                "limitations": ["No redundancy", "Single point of failure"]
            },
            "multi_node": {
                "description": "Multiple Memcached nodes with consistent hashing",
                "node_count": 3,
                "use_case": "Production applications with moderate load",
                "benefits": ["Better distribution", "Higher throughput", "Fault tolerance"]
            },
            "high_performance": {
                "description": "Large Memcached cluster for high performance",
                "node_count": 10,
                "use_case": "High-traffic applications, large datasets",
                "benefits": ["Maximum throughput", "Large memory pool", "Load distribution"]
            }
        }
        
        # Recommend based on requirements
        if expected_connections < 1000 and memory_requirements_gb < 10:
            recommended = "single_node"
        elif expected_connections < 10000 and memory_requirements_gb < 100:
            recommended = "multi_node"
        else:
            recommended = "high_performance"
        
        # Calculate node specifications
        recommended_config = architectures[recommended]
        node_count = recommended_config["node_count"]
        memory_per_node = memory_requirements_gb / node_count
        
        # Select appropriate node type
        node_types = {
            'cache.r6g.large': 13.07,
            'cache.r6g.xlarge': 26.32,
            'cache.r6g.2xlarge': 52.82,
            'cache.r6g.4xlarge': 105.81
        }
        
        suitable_node_type = None
        for node_type, ram_gb in node_types.items():
            if ram_gb >= memory_per_node * 1.2:  # 20% buffer
                suitable_node_type = node_type
                break
        
        return {
            "recommended_architecture": recommended,
            "node_count": node_count,
            "node_type": suitable_node_type,
            "memory_per_node_gb": memory_per_node,
            "total_memory_gb": memory_requirements_gb,
            "architecture_details": recommended_config
        }

# Usage examples
architecture_designer = ElastiCacheArchitecture()

# Design Redis cluster for a web application
redis_design = architecture_designer.design_redis_cluster_architecture(
    use_case="session_storage",
    data_size_gb=25,
    read_write_ratio=80  # 80:1 read to write ratio
)

print("Redis Architecture Recommendation:")
print(f"Recommended: {redis_design['recommended_architecture']}")
print(f"Details: {redis_design['architecture_details']['description']}")

# Calculate memory requirements for Redis
data_types = {
    'string': {'avg_key_size': 25, 'avg_value_size': 150},
    'hash': {'avg_key_size': 30, 'avg_value_size': 500},
    'list': {'avg_key_size': 20, 'avg_value_size': 200},
    'json': {'avg_key_size': 40, 'avg_value_size': 1024}
}

estimated_items = {
    'string': 1000000,  # 1M string keys
    'hash': 500000,     # 500K hash keys
    'list': 100000,     # 100K lists
    'json': 50000       # 50K JSON documents
}

memory_calc = architecture_designer.calculate_memory_requirements(data_types, estimated_items)
print(f"\nMemory Requirements:")
print(f"Total memory needed: {memory_calc['total_memory_required_gb']:.2f} GB")
print(f"Recommended node types: {[n['node_type'] for n in memory_calc['recommended_nodes']]}")

# Design Memcached cluster
memcached_design = architecture_designer.design_memcached_cluster(
    expected_connections=5000,
    memory_requirements_gb=30
)

print(f"\nMemcached Architecture Recommendation:")
print(f"Node count: {memcached_design['node_count']}")
print(f"Node type: {memcached_design['node_type']}")
print(f"Memory per node: {memcached_design['memory_per_node_gb']:.2f} GB")
```

## Redis Deployment Patterns {#redis-deployment}

### Creating and Managing Redis Clusters

```python
class RedisClusterManager:
    def __init__(self):
        self.elasticache = boto3.client('elasticache')
    
    def create_redis_replication_group(self, replication_group_id, description, 
                                       node_type='cache.r6g.large', num_cache_nodes=2,
                                       engine_version='7.0', port=6379, 
                                       parameter_group_name=None, security_group_ids=None,
                                       subnet_group_name=None, multi_az=True,
                                       automatic_failover=True, snapshot_retention_limit=5):
        """
        Create Redis replication group with high availability
        """
        try:
            replication_config = {
                'ReplicationGroupId': replication_group_id,
                'Description': description,
                'NumCacheClusters': num_cache_nodes,
                'CacheNodeType': node_type,
                'Engine': 'redis',
                'EngineVersion': engine_version,
                'Port': port,
                'MultiAZ': multi_az,
                'AutomaticFailoverEnabled': automatic_failover,
                'SnapshotRetentionLimit': snapshot_retention_limit,
                'SnapshotWindow': '03:00-05:00',  # UTC
                'PreferredMaintenanceWindow': 'sun:05:00-sun:06:00',  # UTC
                'Tags': [
                    {'Key': 'Name', 'Value': replication_group_id},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'Service', 'Value': 'redis-cache'}
                ]
            }
            
            if parameter_group_name:
                replication_config['CacheParameterGroupName'] = parameter_group_name
            
            if security_group_ids:
                replication_config['SecurityGroupIds'] = security_group_ids
            
            if subnet_group_name:
                replication_config['CacheSubnetGroupName'] = subnet_group_name
            
            response = self.elasticache.create_replication_group(**replication_config)
            
            print(f"Redis replication group '{replication_group_id}' creation initiated")
            return response
            
        except Exception as e:
            print(f"Error creating Redis replication group: {e}")
            return None
    
    def create_redis_cluster_mode(self, replication_group_id, description,
                                  num_node_groups=3, replicas_per_node_group=1,
                                  node_type='cache.r6g.large', engine_version='7.0',
                                  parameter_group_name=None, security_group_ids=None,
                                  subnet_group_name=None):
        """
        Create Redis cluster with cluster mode enabled for horizontal scaling
        """
        try:
            cluster_config = {
                'ReplicationGroupId': replication_group_id,
                'Description': description,
                'NumNodeGroups': num_node_groups,
                'ReplicasPerNodeGroup': replicas_per_node_group,
                'CacheNodeType': node_type,
                'Engine': 'redis',
                'EngineVersion': engine_version,
                'Port': 6379,
                'AutomaticFailoverEnabled': True,
                'MultiAZ': True,
                'SnapshotRetentionLimit': 7,
                'SnapshotWindow': '03:00-05:00',
                'PreferredMaintenanceWindow': 'sun:05:00-sun:06:00',
                'Tags': [
                    {'Key': 'Name', 'Value': replication_group_id},
                    {'Key': 'ClusterMode', 'Value': 'enabled'},
                    {'Key': 'Environment', 'Value': 'production'}
                ]
            }
            
            if parameter_group_name:
                cluster_config['CacheParameterGroupName'] = parameter_group_name
            
            if security_group_ids:
                cluster_config['SecurityGroupIds'] = security_group_ids
            
            if subnet_group_name:
                cluster_config['CacheSubnetGroupName'] = subnet_group_name
            
            response = self.elasticache.create_replication_group(**cluster_config)
            
            print(f"Redis cluster mode '{replication_group_id}' creation initiated")
            return response
            
        except Exception as e:
            print(f"Error creating Redis cluster mode: {e}")
            return None
    
    def create_parameter_group(self, parameter_group_name, family='redis7.x', description=""):
        """
        Create custom parameter group for Redis optimization
        """
        try:
            response = self.elasticache.create_cache_parameter_group(
                CacheParameterGroupName=parameter_group_name,
                CacheParameterGroupFamily=family,
                Description=description or f'Custom parameter group for {parameter_group_name}'
            )
            
            print(f"Parameter group '{parameter_group_name}' created")
            return response
            
        except Exception as e:
            print(f"Error creating parameter group: {e}")
            return None
    
    def modify_parameter_group(self, parameter_group_name, parameter_changes):
        """
        Modify parameter group with optimization settings
        """
        try:
            parameter_name_values = []
            
            for param_name, param_value in parameter_changes.items():
                parameter_name_values.append({
                    'ParameterName': param_name,
                    'ParameterValue': str(param_value)
                })
            
            response = self.elasticache.modify_cache_parameter_group(
                CacheParameterGroupName=parameter_group_name,
                ParameterNameValues=parameter_name_values
            )
            
            print(f"Parameter group '{parameter_group_name}' modified with {len(parameter_changes)} parameters")
            return response
            
        except Exception as e:
            print(f"Error modifying parameter group: {e}")
            return None
    
    def create_subnet_group(self, subnet_group_name, description, subnet_ids):
        """
        Create cache subnet group for VPC deployment
        """
        try:
            response = self.elasticache.create_cache_subnet_group(
                CacheSubnetGroupName=subnet_group_name,
                CacheSubnetGroupDescription=description,
                SubnetIds=subnet_ids
            )
            
            print(f"Cache subnet group '{subnet_group_name}' created")
            return response
            
        except Exception as e:
            print(f"Error creating subnet group: {e}")
            return None
    
    def enable_auth_token(self, replication_group_id, auth_token):
        """
        Enable Redis AUTH for security
        """
        try:
            response = self.elasticache.modify_replication_group(
                ReplicationGroupId=replication_group_id,
                AuthToken=auth_token,
                AuthTokenUpdateStrategy='ROTATE',
                ApplyImmediately=True
            )
            
            print(f"AUTH token enabled for replication group '{replication_group_id}'")
            return response
            
        except Exception as e:
            print(f"Error enabling AUTH token: {e}")
            return None
    
    def scale_cluster_horizontally(self, replication_group_id, target_node_groups):
        """
        Scale Redis cluster mode horizontally by adding/removing node groups
        """
        try:
            response = self.elasticache.modify_replication_group_shard_configuration(
                ReplicationGroupId=replication_group_id,
                NodeGroupCount=target_node_groups,
                ApplyImmediately=True
            )
            
            print(f"Scaling cluster '{replication_group_id}' to {target_node_groups} node groups")
            return response
            
        except Exception as e:
            print(f"Error scaling cluster: {e}")
            return None
    
    def get_cluster_info(self, replication_group_id):
        """
        Get comprehensive cluster information
        """
        try:
            response = self.elasticache.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            
            if response['ReplicationGroups']:
                cluster = response['ReplicationGroups'][0]
                
                cluster_info = {
                    'replication_group_id': cluster['ReplicationGroupId'],
                    'status': cluster['Status'],
                    'description': cluster['Description'],
                    'cluster_enabled': cluster['ClusterEnabled'],
                    'cache_node_type': cluster['CacheNodeType'],
                    'multi_az': cluster.get('MultiAZ', 'Unknown'),
                    'automatic_failover': cluster.get('AutomaticFailover', 'Unknown'),
                    'num_cache_clusters': len(cluster.get('MemberClusters', [])),
                    'engine_version': cluster.get('CacheClusterRedisVersion', 'Unknown'),
                    'auth_token_enabled': cluster.get('AuthTokenEnabled', False)
                }
                
                # Get endpoint information
                if cluster_info['cluster_enabled']:
                    if 'ConfigurationEndpoint' in cluster:
                        cluster_info['configuration_endpoint'] = {
                            'address': cluster['ConfigurationEndpoint']['Address'],
                            'port': cluster['ConfigurationEndpoint']['Port']
                        }
                else:
                    if 'PrimaryEndpoint' in cluster:
                        cluster_info['primary_endpoint'] = {
                            'address': cluster['PrimaryEndpoint']['Address'],
                            'port': cluster['PrimaryEndpoint']['Port']
                        }
                    
                    if 'ReaderEndpoint' in cluster:
                        cluster_info['reader_endpoint'] = {
                            'address': cluster['ReaderEndpoint']['Address'],
                            'port': cluster['ReaderEndpoint']['Port']
                        }
                
                return cluster_info
            
            return None
            
        except Exception as e:
            print(f"Error getting cluster info: {e}")
            return None

# Usage examples
redis_manager = RedisClusterManager()

# Create subnet group for VPC deployment
subnet_ids = ['subnet-12345678', 'subnet-87654321', 'subnet-11223344']
redis_manager.create_subnet_group(
    'redis-subnet-group',
    'Subnet group for Redis clusters',
    subnet_ids
)

# Create custom parameter group for optimization
redis_manager.create_parameter_group(
    'redis-optimized-params',
    'redis7.x',
    'Optimized Redis parameters for production workloads'
)

# Modify parameter group with optimizations
redis_optimizations = {
    'maxmemory-policy': 'allkeys-lru',
    'timeout': '300',
    'tcp-keepalive': '60',
    'maxclients': '10000',
    'save': '900 1 300 10 60 10000'  # RDB snapshot configuration
}

redis_manager.modify_parameter_group('redis-optimized-params', redis_optimizations)

# Create high-availability Redis replication group
security_group_ids = ['sg-12345678']

ha_cluster = redis_manager.create_redis_replication_group(
    'production-redis-ha',
    'Production Redis with high availability',
    node_type='cache.r6g.xlarge',
    num_cache_nodes=3,  # 1 primary + 2 replicas
    engine_version='7.0',
    parameter_group_name='redis-optimized-params',
    security_group_ids=security_group_ids,
    subnet_group_name='redis-subnet-group',
    multi_az=True,
    automatic_failover=True,
    snapshot_retention_limit=7
)

# Create Redis cluster mode for horizontal scaling
cluster_mode = redis_manager.create_redis_cluster_mode(
    'production-redis-cluster',
    'Production Redis cluster mode for horizontal scaling',
    num_node_groups=3,
    replicas_per_node_group=2,
    node_type='cache.r6g.2xlarge',
    engine_version='7.0',
    parameter_group_name='redis-optimized-params',
    security_group_ids=security_group_ids,
    subnet_group_name='redis-subnet-group'
)

# Get cluster information
import time
time.sleep(30)  # Wait for cluster creation to start

cluster_info = redis_manager.get_cluster_info('production-redis-ha')
if cluster_info:
    print(f"\nCluster Status: {cluster_info['status']}")
    print(f"Node Type: {cluster_info['cache_node_type']}")
    print(f"Multi-AZ: {cluster_info['multi_az']}")
    print(f"Cache Clusters: {cluster_info['num_cache_clusters']}")
```

## Application Integration Patterns {#application-integration}

### Redis Client Integration Examples

```python
import redis
import json
import pickle
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Any, Dict, List
import logging

class RedisClientManager:
    """
    Comprehensive Redis client with common patterns and optimizations
    """
    
    def __init__(self, host='localhost', port=6379, password=None, 
                 db=0, decode_responses=True, socket_timeout=30, 
                 socket_connect_timeout=30, health_check_interval=30):
        """
        Initialize Redis connection with production-ready settings
        """
        self.redis_client = redis.Redis(
            host=host,
            port=port,
            password=password,
            db=db,
            decode_responses=decode_responses,
            socket_timeout=socket_timeout,
            socket_connect_timeout=socket_connect_timeout,
            health_check_interval=health_check_interval,
            retry_on_timeout=True,
            retry_on_error=[ConnectionError, TimeoutError]
        )
        
        self.logger = logging.getLogger(__name__)
    
    def test_connection(self):
        """
        Test Redis connection
        """
        try:
            return self.redis_client.ping()
        except Exception as e:
            self.logger.error(f"Redis connection failed: {e}")
            return False
    
    # Basic Caching Patterns
    
    def get_cached_data(self, key: str, fetch_function=None, ttl: int = 3600):
        """
        Get data from cache or fetch and cache if not exists
        """
        try:
            # Try to get from cache
            cached_value = self.redis_client.get(key)
            
            if cached_value is not None:
                self.logger.debug(f"Cache hit for key: {key}")
                return json.loads(cached_value)
            
            # Cache miss - fetch data if function provided
            if fetch_function:
                self.logger.debug(f"Cache miss for key: {key}, fetching data")
                data = fetch_function()
                
                # Store in cache
                self.set_cached_data(key, data, ttl)
                return data
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting cached data for key {key}: {e}")
            return None
    
    def set_cached_data(self, key: str, data: Any, ttl: int = 3600):
        """
        Set data in cache with TTL
        """
        try:
            serialized_data = json.dumps(data, default=str)
            return self.redis_client.setex(key, ttl, serialized_data)
        except Exception as e:
            self.logger.error(f"Error setting cached data for key {key}: {e}")
            return False
    
    def delete_cached_data(self, key: str):
        """
        Delete data from cache
        """
        try:
            return self.redis_client.delete(key)
        except Exception as e:
            self.logger.error(f"Error deleting cached data for key {key}: {e}")
            return False
    
    # Session Management
    
    def create_session(self, session_id: str, user_data: Dict, ttl: int = 86400):
        """
        Create user session with automatic expiration
        """
        try:
            session_key = f"session:{session_id}"
            session_data = {
                'user_data': user_data,
                'created_at': datetime.utcnow().isoformat(),
                'last_accessed': datetime.utcnow().isoformat()
            }
            
            return self.redis_client.hset(session_key, mapping=session_data) and \
                   self.redis_client.expire(session_key, ttl)
        except Exception as e:
            self.logger.error(f"Error creating session {session_id}: {e}")
            return False
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Get session data and update last accessed time
        """
        try:
            session_key = f"session:{session_id}"
            session_data = self.redis_client.hgetall(session_key)
            
            if session_data:
                # Update last accessed time
                self.redis_client.hset(session_key, 'last_accessed', datetime.utcnow().isoformat())
                
                # Parse user data
                if 'user_data' in session_data:
                    session_data['user_data'] = json.loads(session_data['user_data'])
                
                return session_data
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting session {session_id}: {e}")
            return None
    
    def delete_session(self, session_id: str):
        """
        Delete user session
        """
        try:
            session_key = f"session:{session_id}"
            return self.redis_client.delete(session_key)
        except Exception as e:
            self.logger.error(f"Error deleting session {session_id}: {e}")
            return False
    
    # Rate Limiting
    
    def check_rate_limit(self, identifier: str, limit: int, window: int) -> Dict:
        """
        Implement sliding window rate limiting
        """
        try:
            key = f"rate_limit:{identifier}"
            current_time = datetime.utcnow().timestamp()
            
            # Remove expired entries
            self.redis_client.zremrangebyscore(key, 0, current_time - window)
            
            # Count current requests
            current_count = self.redis_client.zcard(key)
            
            if current_count < limit:
                # Add current request
                self.redis_client.zadd(key, {str(current_time): current_time})
                self.redis_client.expire(key, window)
                
                return {
                    'allowed': True,
                    'current_count': current_count + 1,
                    'limit': limit,
                    'reset_time': current_time + window
                }
            else:
                return {
                    'allowed': False,
                    'current_count': current_count,
                    'limit': limit,
                    'reset_time': current_time + window
                }
        
        except Exception as e:
            self.logger.error(f"Error checking rate limit for {identifier}: {e}")
            return {'allowed': True, 'error': str(e)}
    
    # Real-time Analytics
    
    def increment_counter(self, metric_name: str, increment: int = 1, ttl: Optional[int] = None):
        """
        Increment a counter metric
        """
        try:
            key = f"counter:{metric_name}"
            result = self.redis_client.incrby(key, increment)
            
            if ttl:
                self.redis_client.expire(key, ttl)
            
            return result
        except Exception as e:
            self.logger.error(f"Error incrementing counter {metric_name}: {e}")
            return None
    
    def add_to_leaderboard(self, leaderboard_name: str, member: str, score: float):
        """
        Add member to sorted set leaderboard
        """
        try:
            key = f"leaderboard:{leaderboard_name}"
            return self.redis_client.zadd(key, {member: score})
        except Exception as e:
            self.logger.error(f"Error adding to leaderboard {leaderboard_name}: {e}")
            return False
    
    def get_leaderboard(self, leaderboard_name: str, top_n: int = 10, with_scores: bool = True):
        """
        Get top N members from leaderboard
        """
        try:
            key = f"leaderboard:{leaderboard_name}"
            return self.redis_client.zrevrange(key, 0, top_n - 1, withscores=with_scores)
        except Exception as e:
            self.logger.error(f"Error getting leaderboard {leaderboard_name}: {e}")
            return []
    
    def get_member_rank(self, leaderboard_name: str, member: str):
        """
        Get member rank in leaderboard
        """
        try:
            key = f"leaderboard:{leaderboard_name}"
            rank = self.redis_client.zrevrank(key, member)
            score = self.redis_client.zscore(key, member)
            
            return {
                'rank': rank + 1 if rank is not None else None,
                'score': score
            }
        except Exception as e:
            self.logger.error(f"Error getting member rank for {member}: {e}")
            return None
    
    # Pub/Sub Messaging
    
    def publish_message(self, channel: str, message: Dict):
        """
        Publish message to Redis channel
        """
        try:
            serialized_message = json.dumps(message, default=str)
            return self.redis_client.publish(channel, serialized_message)
        except Exception as e:
            self.logger.error(f"Error publishing to channel {channel}: {e}")
            return 0
    
    def subscribe_to_channels(self, channels: List[str], message_handler):
        """
        Subscribe to Redis channels with message handler
        """
        try:
            pubsub = self.redis_client.pubsub()
            pubsub.subscribe(*channels)
            
            self.logger.info(f"Subscribed to channels: {channels}")
            
            for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        channel = message['channel']
                        data = json.loads(message['data'])
                        message_handler(channel, data)
                    except Exception as e:
                        self.logger.error(f"Error processing message: {e}")
                        
        except Exception as e:
            self.logger.error(f"Error subscribing to channels: {e}")
    
    # Distributed Locking
    
    def acquire_lock(self, lock_name: str, timeout: int = 30, blocking_timeout: int = 10):
        """
        Acquire distributed lock with timeout
        """
        try:
            lock_key = f"lock:{lock_name}"
            identifier = str(datetime.utcnow().timestamp())
            
            # Try to acquire lock
            end_time = datetime.utcnow() + timedelta(seconds=blocking_timeout)
            
            while datetime.utcnow() < end_time:
                if self.redis_client.set(lock_key, identifier, nx=True, ex=timeout):
                    return {'acquired': True, 'identifier': identifier}
                
                time.sleep(0.01)  # Wait 10ms before retry
            
            return {'acquired': False, 'identifier': None}
            
        except Exception as e:
            self.logger.error(f"Error acquiring lock {lock_name}: {e}")
            return {'acquired': False, 'error': str(e)}
    
    def release_lock(self, lock_name: str, identifier: str):
        """
        Release distributed lock safely
        """
        try:
            lock_key = f"lock:{lock_name}"
            
            # Lua script for atomic lock release
            release_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            
            return bool(self.redis_client.eval(release_script, 1, lock_key, identifier))
            
        except Exception as e:
            self.logger.error(f"Error releasing lock {lock_name}: {e}")
            return False

# Example usage
def example_database_query():
    """Example function to simulate database query"""
    import time
    time.sleep(0.1)  # Simulate database latency
    return {
        'users': [
            {'id': 1, 'name': 'John', 'email': 'john@example.com'},
            {'id': 2, 'name': 'Jane', 'email': 'jane@example.com'}
        ],
        'total': 2,
        'fetched_at': datetime.utcnow().isoformat()
    }

# Initialize Redis client
redis_client = RedisClientManager(
    host='my-redis-cluster.abc123.cache.amazonaws.com',
    port=6379,
    password='my-auth-token'
)

# Test connection
if redis_client.test_connection():
    print("Redis connection successful")
    
    # Cache pattern example
    users_data = redis_client.get_cached_data(
        'users:all',
        fetch_function=example_database_query,
        ttl=300  # 5 minutes
    )
    print(f"Users data: {users_data}")
    
    # Session management example
    session_created = redis_client.create_session(
        'user_123_session',
        {
            'user_id': 123,
            'username': 'john_doe',
            'roles': ['user', 'premium'],
            'preferences': {'theme': 'dark', 'notifications': True}
        },
        ttl=86400  # 24 hours
    )
    print(f"Session created: {session_created}")
    
    # Rate limiting example
    rate_limit_result = redis_client.check_rate_limit(
        'api:user:123',
        limit=100,  # 100 requests
        window=3600  # per hour
    )
    print(f"Rate limit check: {rate_limit_result}")
    
    # Leaderboard example
    redis_client.add_to_leaderboard('game_scores', 'player_123', 1500)
    redis_client.add_to_leaderboard('game_scores', 'player_456', 2000)
    redis_client.add_to_leaderboard('game_scores', 'player_789', 1800)
    
    top_players = redis_client.get_leaderboard('game_scores', top_n=5)
    print(f"Top players: {top_players}")
    
    player_rank = redis_client.get_member_rank('game_scores', 'player_123')
    print(f"Player rank: {player_rank}")
    
    # Distributed locking example
    lock_result = redis_client.acquire_lock('critical_section', timeout=30)
    if lock_result['acquired']:
        print("Lock acquired, performing critical operation...")
        # Perform critical operation
        redis_client.release_lock('critical_section', lock_result['identifier'])
        print("Lock released")
    else:
        print("Failed to acquire lock")

else:
    print("Redis connection failed")
```

## Best Practices {#best-practices}

### ElastiCache Optimization and Operational Excellence

```python
class ElastiCacheBestPractices:
    def __init__(self):
        self.elasticache = boto3.client('elasticache')
        self.cloudwatch = boto3.client('cloudwatch')
    
    def implement_performance_optimization(self):
        """
        Implement performance optimization best practices
        """
        optimization_strategies = {
            'redis_specific_optimizations': {
                'memory_management': {
                    'strategies': [
                        'Use appropriate eviction policies (allkeys-lru, volatile-lru)',
                        'Monitor memory usage and configure maxmemory',
                        'Use Redis data structures efficiently',
                        'Implement proper key naming conventions',
                        'Set appropriate TTL for temporary data'
                    ],
                    'parameter_tuning': {
                        'maxmemory-policy': 'allkeys-lru',
                        'maxmemory-samples': 5,
                        'timeout': 300,
                        'tcp-keepalive': 60,
                        'save': '900 1 300 10 60 10000'
                    }
                },
                'connection_optimization': {
                    'strategies': [
                        'Use connection pooling in applications',
                        'Configure appropriate client timeouts',
                        'Enable persistent connections',
                        'Use pipelining for bulk operations',
                        'Monitor connection metrics'
                    ],
                    'client_configuration': {
                        'socket_timeout': 30,
                        'socket_connect_timeout': 30,
                        'health_check_interval': 30,
                        'retry_on_timeout': True,
                        'max_connections': 50
                    }
                },
                'data_structure_optimization': {
                    'hash_optimization': {
                        'description': 'Use hashes for objects with many fields',
                        'benefit': 'Memory efficient for small objects',
                        'example': 'user:{id} -> hash with name, email, etc.'
                    },
                    'list_optimization': {
                        'description': 'Use lists for ordered data',
                        'operations': ['LPUSH', 'RPOP', 'LRANGE'],
                        'use_cases': ['Queue implementation', 'Recent items']
                    },
                    'set_optimization': {
                        'description': 'Use sets for unique collections',
                        'operations': ['SADD', 'SISMEMBER', 'SINTER'],
                        'use_cases': ['Tags', 'Unique visitors', 'Permissions']
                    },
                    'sorted_set_optimization': {
                        'description': 'Use sorted sets for ranked data',
                        'operations': ['ZADD', 'ZRANGE', 'ZRANK'],
                        'use_cases': ['Leaderboards', 'Time-series data', 'Priority queues']
                    }
                }
            },
            'memcached_specific_optimizations': {
                'memory_management': {
                    'strategies': [
                        'Use consistent hashing for data distribution',
                        'Monitor slab allocation and memory usage',
                        'Configure appropriate chunk sizes',
                        'Avoid memory fragmentation',
                        'Use appropriate expiration times'
                    ]
                },
                'client_optimization': {
                    'strategies': [
                        'Use binary protocol for better performance',
                        'Implement proper connection pooling',
                        'Use multi-get operations for bulk retrieval',
                        'Configure appropriate timeouts',
                        'Handle failover scenarios gracefully'
                    ]
                }
            },
            'general_optimizations': {
                'key_design': {
                    'naming_conventions': [
                        'Use hierarchical naming (app:module:id)',
                        'Keep key names short but descriptive',
                        'Use consistent patterns across application',
                        'Avoid special characters in key names',
                        'Include version information where needed'
                    ],
                    'examples': {
                        'user_profile': 'user:profile:123',
                        'session_data': 'session:abc123def456',
                        'cache_query': 'cache:query:hash:xyz789',
                        'rate_limit': 'rate_limit:api:user:123'
                    }
                },
                'ttl_strategy': {
                    'guidelines': [
                        'Set appropriate TTL based on data freshness requirements',
                        'Use longer TTL for stable data',
                        'Use shorter TTL for frequently changing data',
                        'Consider cache warming strategies',
                        'Monitor TTL effectiveness'
                    ],
                    'recommended_ttl': {
                        'user_profiles': '3600-7200s (1-2 hours)',
                        'session_data': '86400s (24 hours)',
                        'api_responses': '300-1800s (5-30 minutes)',
                        'configuration': '3600-43200s (1-12 hours)',
                        'temporary_data': '60-300s (1-5 minutes)'
                    }
                }
            }
        }
        
        return optimization_strategies
    
    def setup_comprehensive_monitoring(self, cluster_ids):
        """
        Set up comprehensive monitoring for ElastiCache clusters
        """
        monitoring_setup = {
            'key_metrics_to_monitor': {
                'redis_metrics': [
                    'CPUUtilization',
                    'DatabaseMemoryUsagePercentage', 
                    'NetworkBytesIn',
                    'NetworkBytesOut',
                    'CacheHits',
                    'CacheMisses',
                    'ReplicationLag',
                    'NumberOfConnections',
                    'Evictions',
                    'CurrentConnections'
                ],
                'memcached_metrics': [
                    'CPUUtilization',
                    'SwapUsage',
                    'CacheHits',
                    'CacheMisses',
                    'Evictions',
                    'NumberOfConnections',
                    'BytesUsedForCacheItems',
                    'NetworkBytesIn',
                    'NetworkBytesOut'
                ]
            },
            'custom_dashboards': self._create_monitoring_dashboard(cluster_ids),
            'alerting_strategy': self._setup_alerting_strategy(cluster_ids)
        }
        
        return monitoring_setup
    
    def _create_monitoring_dashboard(self, cluster_ids):
        """
        Create comprehensive CloudWatch dashboard
        """
        dashboard_config = {
            'widgets': [
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/ElastiCache', 'CPUUtilization', 'CacheClusterId', cluster_id]
                            for cluster_id in cluster_ids
                        ],
                        'period': 300,
                        'stat': 'Average',
                        'region': 'us-east-1',
                        'title': 'CPU Utilization'
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/ElastiCache', 'DatabaseMemoryUsagePercentage', 'CacheClusterId', cluster_id]
                            for cluster_id in cluster_ids
                        ],
                        'period': 300,
                        'stat': 'Average',
                        'region': 'us-east-1',
                        'title': 'Memory Usage'
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/ElastiCache', 'CacheHitRate', 'CacheClusterId', cluster_id]
                            for cluster_id in cluster_ids
                        ],
                        'period': 300,
                        'stat': 'Average',
                        'region': 'us-east-1',
                        'title': 'Cache Hit Rate'
                    }
                }
            ]
        }
        
        return dashboard_config
    
    def _setup_alerting_strategy(self, cluster_ids):
        """
        Set up comprehensive alerting for ElastiCache clusters
        """
        alerts_created = []
        
        for cluster_id in cluster_ids:
            # High CPU utilization alert
            try:
                self.cloudwatch.put_metric_alarm(
                    AlarmName=f'ElastiCache-{cluster_id}-HighCPU',
                    ComparisonOperator='GreaterThanThreshold',
                    EvaluationPeriods=2,
                    MetricName='CPUUtilization',
                    Namespace='AWS/ElastiCache',
                    Period=300,
                    Statistic='Average',
                    Threshold=80.0,
                    ActionsEnabled=True,
                    AlarmActions=[
                        'arn:aws:sns:us-east-1:123456789012:elasticache-alerts'
                    ],
                    AlarmDescription=f'High CPU utilization on ElastiCache cluster {cluster_id}',
                    Dimensions=[
                        {
                            'Name': 'CacheClusterId',
                            'Value': cluster_id
                        }
                    ]
                )
                alerts_created.append(f'ElastiCache-{cluster_id}-HighCPU')
                
                # High memory usage alert
                self.cloudwatch.put_metric_alarm(
                    AlarmName=f'ElastiCache-{cluster_id}-HighMemory',
                    ComparisonOperator='GreaterThanThreshold',
                    EvaluationPeriods=2,
                    MetricName='DatabaseMemoryUsagePercentage',
                    Namespace='AWS/ElastiCache',
                    Period=300,
                    Statistic='Average',
                    Threshold=85.0,
                    ActionsEnabled=True,
                    AlarmActions=[
                        'arn:aws:sns:us-east-1:123456789012:elasticache-alerts'
                    ],
                    AlarmDescription=f'High memory usage on ElastiCache cluster {cluster_id}',
                    Dimensions=[
                        {
                            'Name': 'CacheClusterId',
                            'Value': cluster_id
                        }
                    ]
                )
                alerts_created.append(f'ElastiCache-{cluster_id}-HighMemory')
                
                # Low cache hit rate alert
                self.cloudwatch.put_metric_alarm(
                    AlarmName=f'ElastiCache-{cluster_id}-LowHitRate',
                    ComparisonOperator='LessThanThreshold',
                    EvaluationPeriods=3,
                    MetricName='CacheHitRate',
                    Namespace='AWS/ElastiCache',
                    Period=300,
                    Statistic='Average',
                    Threshold=0.8,  # 80% hit rate threshold
                    ActionsEnabled=True,
                    AlarmActions=[
                        'arn:aws:sns:us-east-1:123456789012:elasticache-performance'
                    ],
                    AlarmDescription=f'Low cache hit rate on ElastiCache cluster {cluster_id}',
                    Dimensions=[
                        {
                            'Name': 'CacheClusterId',
                            'Value': cluster_id
                        }
                    ]
                )
                alerts_created.append(f'ElastiCache-{cluster_id}-LowHitRate')
                
            except Exception as e:
                print(f"Error creating alerts for cluster {cluster_id}: {e}")
        
        return alerts_created
    
    def implement_security_best_practices(self):
        """
        Implement security best practices for ElastiCache
        """
        security_practices = {
            'network_security': {
                'vpc_deployment': {
                    'description': 'Deploy ElastiCache in private subnets',
                    'requirements': [
                        'Create cache subnet groups with private subnets',
                        'Configure security groups with minimal access',
                        'Use VPC endpoints for API access',
                        'Enable VPC Flow Logs for monitoring'
                    ]
                },
                'security_groups': {
                    'description': 'Configure restrictive security groups',
                    'rules_example': {
                        'inbound_rules': [
                            {
                                'protocol': 'TCP',
                                'port': 6379,  # Redis
                                'source': 'application security group',
                                'description': 'Redis access from application servers'
                            },
                            {
                                'protocol': 'TCP',
                                'port': 11211,  # Memcached
                                'source': 'application security group', 
                                'description': 'Memcached access from application servers'
                            }
                        ],
                        'outbound_rules': 'No outbound rules needed'
                    }
                }
            },
            'data_security': {
                'encryption_at_rest': {
                    'description': 'Enable encryption for data at rest',
                    'supported_engines': ['Redis'],
                    'configuration': {
                        'at_rest_encryption_enabled': True,
                        'kms_key_id': 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
                    }
                },
                'encryption_in_transit': {
                    'description': 'Enable TLS for data in transit',
                    'supported_engines': ['Redis'],
                    'configuration': {
                        'transit_encryption_enabled': True,
                        'auth_token_enabled': True
                    }
                }
            },
            'access_control': {
                'redis_auth': {
                    'description': 'Enable Redis AUTH token',
                    'implementation': [
                        'Generate secure AUTH token',
                        'Enable AUTH token on cluster',
                        'Use AUTH token in client applications',
                        'Rotate AUTH tokens regularly'
                    ]
                },
                'iam_policies': {
                    'description': 'Use IAM for API access control',
                    'policy_example': '''
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "elasticache:DescribeReplicationGroups",
                "elasticache:DescribeCacheClusters"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "elasticache:ModifyReplicationGroup"
            ],
            "Resource": "arn:aws:elasticache:*:*:replicationgroup/production-*"
        }
    ]
}
'''
                }
            },
            'monitoring_security': {
                'audit_logging': [
                    'Enable CloudTrail for ElastiCache API calls',
                    'Monitor security group changes',
                    'Track parameter group modifications',
                    'Log authentication failures'
                ],
                'security_metrics': [
                    'Monitor connection attempts',
                    'Track authentication failures',
                    'Alert on configuration changes',
                    'Monitor network traffic patterns'
                ]
            }
        }
        
        return security_practices
    
    def implement_high_availability_patterns(self):
        """
        Implement high availability and disaster recovery patterns
        """
        ha_patterns = {
            'redis_ha_patterns': {
                'multi_az_deployment': {
                    'description': 'Deploy across multiple AZs for fault tolerance',
                    'configuration': {
                        'MultiAZ': True,
                        'AutomaticFailoverEnabled': True,
                        'NumCacheClusters': 3,  # Primary + 2 replicas
                        'PreferredCacheClusterAZs': ['us-east-1a', 'us-east-1b', 'us-east-1c']
                    },
                    'benefits': [
                        'Automatic failover in case of AZ failure',
                        'Read scaling across AZs',
                        'Reduced latency with geographically distributed replicas'
                    ]
                },
                'cluster_mode_scaling': {
                    'description': 'Use cluster mode for horizontal scaling',
                    'configuration': {
                        'ClusterEnabled': True,
                        'NumNodeGroups': 3,
                        'ReplicasPerNodeGroup': 2,
                        'AutomaticFailoverEnabled': True
                    },
                    'benefits': [
                        'Horizontal scaling capability',
                        'Data partitioning across shards',
                        'High availability within each shard'
                    ]
                }
            },
            'backup_strategies': {
                'automatic_backups': {
                    'description': 'Configure automatic backups',
                    'configuration': {
                        'SnapshotRetentionLimit': 7,  # Keep 7 days of backups
                        'SnapshotWindow': '03:00-05:00',  # Low traffic window
                        'PreferredMaintenanceWindow': 'sun:05:00-sun:06:00'
                    }
                },
                'manual_snapshots': {
                    'description': 'Create manual snapshots for major changes',
                    'best_practices': [
                        'Create snapshots before major deployments',
                        'Tag snapshots with purpose and date',
                        'Test snapshot restoration process',
                        'Copy snapshots to different regions for DR'
                    ]
                }
            },
            'disaster_recovery': {
                'cross_region_replication': {
                    'description': 'Use Global Datastore for cross-region DR',
                    'setup': {
                        'primary_region': 'us-east-1',
                        'secondary_regions': ['us-west-2'],
                        'replication_lag': 'Sub-second to few seconds',
                        'failover_rto': '< 1 minute'
                    }
                },
                'backup_restoration': {
                    'description': 'Restore from backups in DR scenarios',
                    'procedures': [
                        'Identify appropriate backup point',
                        'Create new cluster from backup',
                        'Update application configuration',
                        'Verify data integrity',
                        'Switch traffic to new cluster'
                    ]
                }
            }
        }
        
        return ha_patterns

# Best practices implementation
best_practices = ElastiCacheBestPractices()

# Get performance optimization strategies
optimization_strategies = best_practices.implement_performance_optimization()
print("ElastiCache Performance Optimization Strategies:")
print(json.dumps(optimization_strategies, indent=2, default=str))

# Set up monitoring for clusters
cluster_ids = ['production-redis-001', 'production-redis-002']
monitoring_setup = best_practices.setup_comprehensive_monitoring(cluster_ids)
print(f"\nMonitoring setup completed. Dashboard widgets: {len(monitoring_setup['custom_dashboards']['widgets'])}")

# Get security best practices
security_practices = best_practices.implement_security_best_practices()
print("\nSecurity Best Practices:")
print(json.dumps(security_practices, indent=2))

# Get high availability patterns
ha_patterns = best_practices.implement_high_availability_patterns()
print("\nHigh Availability Patterns:")
print(json.dumps(ha_patterns, indent=2))
```

## Cost Optimization {#cost-optimization}

### ElastiCache Cost Management

```python
class ElastiCacheCostOptimizer:
    def __init__(self):
        self.elasticache = boto3.client('elasticache')
        self.ce = boto3.client('ce')  # Cost Explorer
        self.cloudwatch = boto3.client('cloudwatch')
    
    def analyze_elasticache_costs(self, start_date, end_date):
        """
        Analyze ElastiCache costs and usage patterns
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
                        'Values': ['Amazon ElastiCache']
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
            print(f"Error analyzing ElastiCache costs: {e}")
            return {}
    
    def optimize_cluster_sizing(self):
        """
        Analyze cluster configurations for right-sizing opportunities
        """
        try:
            # Get all replication groups (Redis clusters)
            replication_groups = self.elasticache.describe_replication_groups()
            
            optimization_recommendations = []
            
            for rg in replication_groups['ReplicationGroups']:
                rg_id = rg['ReplicationGroupId']
                node_type = rg['CacheNodeType']
                cluster_enabled = rg.get('ClusterEnabled', False)
                
                recommendations = []
                current_monthly_cost = self._calculate_monthly_cost(rg)
                
                # Analyze node type efficiency
                if node_type.startswith('cache.r5.'):
                    r6g_equivalent = node_type.replace('r5.', 'r6g.')
                    savings_percentage = 20  # Graviton2 typically 20% cheaper
                    
                    recommendations.append({
                        'type': 'node_type_optimization',
                        'description': f'Upgrade to Graviton2 instance ({r6g_equivalent})',
                        'current_node_type': node_type,
                        'recommended_node_type': r6g_equivalent,
                        'estimated_monthly_savings': current_monthly_cost * (savings_percentage / 100),
                        'savings_percentage': savings_percentage
                    })
                
                # Analyze memory utilization
                memory_metrics = self._get_memory_utilization(rg_id)
                if memory_metrics and memory_metrics['avg_memory_usage'] < 50:
                    # Suggest smaller instance type
                    smaller_instance = self._suggest_smaller_instance(node_type)
                    if smaller_instance:
                        recommendations.append({
                            'type': 'downsize_instance',
                            'description': f'Low memory utilization ({memory_metrics["avg_memory_usage"]:.1f}%)',
                            'current_node_type': node_type,
                            'recommended_node_type': smaller_instance['node_type'],
                            'estimated_monthly_savings': smaller_instance['monthly_savings'],
                            'current_memory_usage': memory_metrics['avg_memory_usage']
                        })
                
                # Analyze replica count
                num_clusters = len(rg.get('MemberClusters', []))
                if num_clusters > 3 and not cluster_enabled:
                    recommendations.append({
                        'type': 'replica_optimization',
                        'description': f'High replica count ({num_clusters}) without cluster mode',
                        'current_replicas': num_clusters - 1,  # Subtract primary
                        'recommended_replicas': 2,
                        'estimated_monthly_savings': current_monthly_cost * 0.3,  # Rough estimate
                        'action': 'Consider enabling cluster mode or reducing replicas'
                    })
                
                if recommendations:
                    total_monthly_savings = sum(
                        r.get('estimated_monthly_savings', 0) for r in recommendations
                    )
                    
                    optimization_recommendations.append({
                        'replication_group_id': rg_id,
                        'current_node_type': node_type,
                        'current_monthly_cost': current_monthly_cost,
                        'num_clusters': num_clusters,
                        'cluster_enabled': cluster_enabled,
                        'recommendations': recommendations,
                        'total_potential_monthly_savings': total_monthly_savings
                    })
            
            return optimization_recommendations
            
        except Exception as e:
            print(f"Error optimizing cluster sizing: {e}")
            return []
    
    def _calculate_monthly_cost(self, replication_group):
        """
        Calculate estimated monthly cost for a replication group
        """
        node_type = replication_group['CacheNodeType']
        num_clusters = len(replication_group.get('MemberClusters', []))
        
        # ElastiCache pricing (approximate, varies by region)
        pricing_map = {
            'cache.t3.micro': 0.017,
            'cache.t3.small': 0.034,
            'cache.t3.medium': 0.068,
            'cache.r6g.large': 0.126,
            'cache.r6g.xlarge': 0.252,
            'cache.r6g.2xlarge': 0.504,
            'cache.r6g.4xlarge': 1.008,
            'cache.r5.large': 0.158,
            'cache.r5.xlarge': 0.316,
            'cache.r5.2xlarge': 0.632,
            'cache.r5.4xlarge': 1.264
        }
        
        hourly_cost = pricing_map.get(node_type, 0.1)  # Default fallback
        monthly_cost = hourly_cost * 24 * 30 * num_clusters  # Hours per month * clusters
        
        return monthly_cost
    
    def _get_memory_utilization(self, replication_group_id):
        """
        Get memory utilization metrics for optimization analysis
        """
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=7)  # Last 7 days
            
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ElastiCache',
                MetricName='DatabaseMemoryUsagePercentage',
                Dimensions=[
                    {
                        'Name': 'ReplicationGroupId',
                        'Value': replication_group_id
                    }
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=['Average']
            )
            
            if response['Datapoints']:
                avg_usage = sum(dp['Average'] for dp in response['Datapoints']) / len(response['Datapoints'])
                max_usage = max(dp['Average'] for dp in response['Datapoints'])
                
                return {
                    'avg_memory_usage': avg_usage,
                    'max_memory_usage': max_usage,
                    'datapoints_count': len(response['Datapoints'])
                }
            
            return None
            
        except Exception as e:
            print(f"Error getting memory utilization: {e}")
            return None
    
    def _suggest_smaller_instance(self, current_node_type):
        """
        Suggest smaller instance type based on current type
        """
        downsize_mapping = {
            'cache.r6g.4xlarge': {'node_type': 'cache.r6g.2xlarge', 'monthly_savings': 400},
            'cache.r6g.2xlarge': {'node_type': 'cache.r6g.xlarge', 'monthly_savings': 200},
            'cache.r6g.xlarge': {'node_type': 'cache.r6g.large', 'monthly_savings': 100},
            'cache.r5.4xlarge': {'node_type': 'cache.r5.2xlarge', 'monthly_savings': 500},
            'cache.r5.2xlarge': {'node_type': 'cache.r5.xlarge', 'monthly_savings': 250},
            'cache.r5.xlarge': {'node_type': 'cache.r5.large', 'monthly_savings': 125}
        }
        
        return downsize_mapping.get(current_node_type)
    
    def analyze_reserved_instances_opportunity(self):
        """
        Analyze Reserved Instance opportunities for cost savings
        """
        try:
            # Get all running clusters
            replication_groups = self.elasticache.describe_replication_groups()
            cache_clusters = self.elasticache.describe_cache_clusters()
            
            instance_usage = {}
            
            # Analyze replication groups
            for rg in replication_groups['ReplicationGroups']:
                node_type = rg['CacheNodeType']
                num_clusters = len(rg.get('MemberClusters', []))
                
                if node_type not in instance_usage:
                    instance_usage[node_type] = 0
                instance_usage[node_type] += num_clusters
            
            # Analyze standalone cache clusters
            for cluster in cache_clusters['CacheClusters']:
                if not cluster.get('ReplicationGroupId'):  # Standalone cluster
                    node_type = cluster['CacheNodeType']
                    if node_type not in instance_usage:
                        instance_usage[node_type] = 0
                    instance_usage[node_type] += 1
            
            # Calculate potential savings with Reserved Instances
            ri_recommendations = []
            
            for node_type, count in instance_usage.items():
                if count >= 1:  # Consider RI for any running instances
                    on_demand_hourly = self._get_on_demand_pricing(node_type)
                    ri_hourly = on_demand_hourly * 0.6  # Assume 40% savings with 1-year RI
                    
                    monthly_on_demand = on_demand_hourly * 24 * 30 * count
                    monthly_ri_cost = ri_hourly * 24 * 30 * count
                    monthly_savings = monthly_on_demand - monthly_ri_cost
                    
                    ri_recommendations.append({
                        'node_type': node_type,
                        'instance_count': count,
                        'monthly_on_demand_cost': monthly_on_demand,
                        'monthly_ri_cost': monthly_ri_cost,
                        'monthly_savings': monthly_savings,
                        'annual_savings': monthly_savings * 12,
                        'savings_percentage': (monthly_savings / monthly_on_demand) * 100
                    })
            
            # Sort by potential savings
            ri_recommendations.sort(key=lambda x: x['annual_savings'], reverse=True)
            
            return ri_recommendations
            
        except Exception as e:
            print(f"Error analyzing Reserved Instance opportunities: {e}")
            return []
    
    def _get_on_demand_pricing(self, node_type):
        """
        Get on-demand pricing for node type
        """
        pricing_map = {
            'cache.t3.micro': 0.017,
            'cache.t3.small': 0.034,
            'cache.t3.medium': 0.068,
            'cache.r6g.large': 0.126,
            'cache.r6g.xlarge': 0.252,
            'cache.r6g.2xlarge': 0.504,
            'cache.r6g.4xlarge': 1.008,
            'cache.r5.large': 0.158,
            'cache.r5.xlarge': 0.316,
            'cache.r5.2xlarge': 0.632,
            'cache.r5.4xlarge': 1.264
        }
        
        return pricing_map.get(node_type, 0.1)
    
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
            'current_costs': self.analyze_elasticache_costs(start_date, end_date),
            'cluster_optimizations': self.optimize_cluster_sizing(),
            'reserved_instance_opportunities': self.analyze_reserved_instances_opportunity(),
            'recommendations_summary': {
                'immediate_actions': [
                    'Upgrade to Graviton2 instances for 20% cost reduction',
                    'Right-size instances based on actual memory usage',
                    'Consider Reserved Instances for consistent workloads',
                    'Remove unnecessary read replicas'
                ],
                'cost_reduction_strategies': [
                    'Implement proper cache eviction policies',
                    'Monitor and optimize cache hit rates',
                    'Use appropriate data compression',
                    'Implement cache warming strategies to reduce miss rates'
                ]
            }
        }
        
        # Calculate total potential savings
        cluster_savings = sum(
            opt['total_potential_monthly_savings'] 
            for opt in report['cluster_optimizations']
        )
        
        ri_savings = sum(
            ri['monthly_savings']
            for ri in report['reserved_instance_opportunities']
        )
        
        total_monthly_savings = cluster_savings + ri_savings
        
        report['cost_summary'] = {
            'cluster_optimization_monthly_savings': cluster_savings,
            'reserved_instance_monthly_savings': ri_savings,
            'total_monthly_savings': total_monthly_savings,
            'annual_savings_projection': total_monthly_savings * 12
        }
        
        return report

# Cost optimization examples
cost_optimizer = ElastiCacheCostOptimizer()

# Generate comprehensive cost optimization report
report = cost_optimizer.generate_cost_optimization_report()
print("ElastiCache Cost Optimization Report")
print("=" * 40)
print(f"Total Monthly Savings Potential: ${report['cost_summary']['total_monthly_savings']:.2f}")
print(f"Annual Savings Projection: ${report['cost_summary']['annual_savings_projection']:.2f}")

print(f"\nCluster Optimization Opportunities: {len(report['cluster_optimizations'])}")
for opt in report['cluster_optimizations'][:3]:  # Show top 3
    print(f"  {opt['replication_group_id']}: ${opt['total_potential_monthly_savings']:.2f}/month")

print(f"\nReserved Instance Opportunities: {len(report['reserved_instance_opportunities'])}")
for ri in report['reserved_instance_opportunities'][:3]:  # Show top 3
    print(f"  {ri['node_type']} ({ri['instance_count']} instances): ${ri['monthly_savings']:.2f}/month savings")

print("\nTop Recommendations:")
for rec in report['recommendations_summary']['immediate_actions']:
    print(f"  - {rec}")
```

## Conclusion

Amazon ElastiCache provides high-performance, managed in-memory caching solutions with both Redis and Memcached engines. Key takeaways:

### Engine Selection:
- **Redis**: Choose for complex data structures, persistence, pub/sub, and advanced features
- **Memcached**: Choose for simple key-value caching with multi-threaded performance
- Both engines offer sub-millisecond latency and horizontal scaling capabilities

### Architecture Patterns:
- **Single Node**: Development and small applications
- **High Availability**: Production workloads with automatic failover
- **Cluster Mode**: Large-scale applications requiring horizontal scaling  
- **Global Datastore**: Cross-region replication for global applications

### Best Practices:
- Implement proper key naming conventions and TTL strategies
- Use connection pooling and optimize client configurations
- Set up comprehensive monitoring with CloudWatch metrics and custom dashboards
- Implement security best practices with VPC deployment, encryption, and AUTH tokens
- Design for high availability with Multi-AZ deployments and automatic failover

### Cost Optimization Strategies:
- Upgrade to Graviton2 instances for 20% cost reduction
- Right-size instances based on actual memory utilization
- Use Reserved Instances for consistent workloads (40-60% savings)
- Optimize replica counts based on read patterns
- Monitor cache hit rates and optimize data access patterns

### Operational Excellence:
- Use infrastructure as code for cluster deployment and management
- Implement comprehensive monitoring and alerting strategies
- Establish backup and disaster recovery procedures
- Regular performance tuning and capacity planning
- Security compliance with encryption and access controls

ElastiCache enables applications to achieve dramatic performance improvements by reducing database load and providing sub-millisecond data access, making it essential for high-performance web applications, gaming, real-time analytics, and session management use cases.