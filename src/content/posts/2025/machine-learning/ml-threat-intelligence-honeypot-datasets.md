---
author: Anubhav Gain
pubDatetime: 2025-09-24T10:00:00+05:30
modDatetime: 2025-10-04T14:00:00+05:30
title: "Building ML-Powered Threat Intelligence with Honeypot Datasets: From Raw Data to Production Models"
slug: ml-threat-intelligence-honeypot-datasets
featured: true
draft: false
tags:
  - Machine-Learning
  - Cybersecurity
  - Honeypot
  - Threat-Intelligence
  - Datasets
  - Hugging-Face
  - Anomaly-Detection
  - Network-Security
  - Attack-Classification
  - Security-Analytics
  - DevSecOps
  - Feature-Engineering
  - Threat-Hunting
  - Python
  - AI-Security
category: AI-Security
description: Complete guide to building production-ready machine learning threat detection systems using real honeypot datasets. Learn data preprocessing, feature engineering, model selection, and deployment strategies for AI-powered security analytics.
---

# Building ML-Powered Threat Intelligence with Honeypot Datasets: From Raw Data to Production Models

## Introduction

Picture this: you're staring at security logs with thousands of events streaming in daily. Which ones are actually dangerous? Which can you safely ignore? Traditional signature-based detection is like playing whack-a-mole with cybercriminals — they've gotten really good at dodging known signatures faster than we can create them.

Enter machine learning — your new cybersecurity superpower! Imagine having a system that learns attacker behavior patterns and predicts new threats before they even hit signature databases. Sounds too good to be true? Well, it's not!

Honeypot data is the secret sauce that makes this magic happen. Unlike those sterile academic datasets gathering dust, honeypots capture real attackers in their natural habitat — like having a hidden camera in the cybercriminal underworld. This authentic data gives us unprecedented insights into how bad actors actually operate.

In this comprehensive guide, I'll take you on a journey from raw honeypot data to a working threat detection system that would make any SOC analyst jealous. Ready to turn chaos into clarity and transform your threat detection game? Let's dive in!

## Table of Contents

## Part 1: Understanding Honeypot Data

### What's Hidden in Your Honeypot Data?

Before we start cooking up some ML magic, let's peek behind the curtain and see what treasures our honeypot traps actually capture. Think of honeypots as security cameras recording cybercriminals in action. Here's what our "footage" reveals:

#### Network Flow Data

Raw network connections contain fundamental information about attack patterns:

- **Source/Destination IPs and Ports**: Geographic and service targeting patterns
- **Protocol Information**: TCP/UDP usage, application layer protocols
- **Flow Statistics**: Packet counts, byte volumes, session duration
- **Timing Data**: Connection timestamps, session intervals

**Example Network Flow:**

```json
{
  "timestamp": "2025-09-24T14:30:15Z",
  "src_ip": "203.0.113.5",
  "src_port": 54321,
  "dst_ip": "10.0.0.100",
  "dst_port": 22,
  "protocol": "TCP",
  "bytes_sent": 1024,
  "bytes_received": 256,
  "session_duration": 45.2,
  "packet_count": 12
}
```

#### Application-Layer Events

Higher-level application interactions provide behavioral insights:

- **Login Attempts**: Credential stuffing, brute force patterns
- **Command Execution**: Shell commands, malware deployment
- **File Operations**: Upload/download activities, data exfiltration attempts
- **Protocol-Specific Actions**: HTTP requests, SSH sessions, database queries

**Example SSH Attack:**

```json
{
  "event_type": "ssh_login_attempt",
  "username": "admin",
  "password": "password123",
  "success": false,
  "command_attempts": ["whoami", "cat /etc/passwd"],
  "session_duration": 12.5
}
```

#### Enriched Metadata

Additional context enhances the raw data:

- **Geolocation**: Country, region, ASN information
- **Threat Intelligence**: IP reputation, known malware signatures
- **Behavioral Patterns**: Session clustering, attack campaign attribution

**Example Enriched Event:**

```json
{
  "src_ip": "203.0.113.5",
  "country": "CN",
  "region": "Beijing",
  "asn": "AS4134",
  "isp": "China Telecom",
  "threat_score": 8.5,
  "known_malicious": true,
  "attack_campaign": "SSH_Brute_Force_2025_Q3"
}
```

### Types of Honeypot Data

#### Low-Interaction Honeypots

- **Characteristics**: Emulate services, minimal attacker interaction
- **Data Quality**: High volume, less detailed
- **Use Cases**: Network scanning detection, port enumeration analysis
- **Examples**: Honeyd, KFSensor

#### High-Interaction Honeypots

- **Characteristics**: Full operating systems, deep attacker interaction
- **Data Quality**: Lower volume, highly detailed
- **Use Cases**: Malware analysis, attack technique research
- **Examples**: Honeynet, Cowrie

#### Hybrid Approaches

- **Characteristics**: Combination of both approaches
- **Data Quality**: Balanced volume and detail
- **Use Cases**: Comprehensive threat intelligence
- **Examples**: Modern honeypot farms with multiple honeypot types

## Part 2: Data Preprocessing Pipeline

### Turning Chaos into Order: Data Cleaning

Raw honeypot data is like crude oil — full of potential, but you need to refine it first! Think of yourself as a detective sorting through evidence: some witness statements are unreliable, timestamps don't add up, and some records are just duplicates. Here's how we bring order to this beautiful chaos:

#### Step 1: Data Validation and Sanitization

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import ipaddress

def validate_network_data(df):
    """
    Validate and sanitize network security data

    Args:
        df: Raw honeypot data DataFrame

    Returns:
        Cleaned DataFrame with validated fields
    """
    # Map column names (handle various naming conventions)
    column_mapping = {
        'dest_port': 'dst_port',
        'destination_port': 'dst_port',
        'source_port': 'src_port',
        '@timestamp': 'timestamp',
        'time': 'timestamp'
    }

    for old_col, new_col in column_mapping.items():
        if old_col in df.columns and new_col not in df.columns:
            df[new_col] = df[old_col]

    # Convert timestamp with UTC handling for mixed timezones
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(
            df['timestamp'],
            format='mixed',
            errors='coerce',
            utc=True
        )
    else:
        raise ValueError("No timestamp column found in data")

    # Convert port columns to numeric, handling string ports
    for port_col in ['src_port', 'dst_port']:
        if port_col in df.columns:
            df[port_col] = pd.to_numeric(df[port_col], errors='coerce')

    # Validate and clean IP addresses
    if 'src_ip' in df.columns:
        df['src_ip'] = df['src_ip'].astype(str)
        # IPv4 regex pattern
        ipv4_pattern = r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'
        df = df[df['src_ip'].str.match(ipv4_pattern, na=False)]

        # Additional validation - ensure valid IP addresses
        def is_valid_ip(ip):
            try:
                ipaddress.ip_address(ip)
                return True
            except ValueError:
                return False

        df = df[df['src_ip'].apply(is_valid_ip)]

    # Validate port ranges (1-65535)
    if 'src_port' in df.columns:
        df = df[
            df['src_port'].notna() &
            (df['src_port'] >= 1) &
            (df['src_port'] <= 65535)
        ]

    if 'dst_port' in df.columns:
        df = df[
            df['dst_port'].notna() &
            (df['dst_port'] >= 1) &
            (df['dst_port'] <= 65535)
        ]

    # Remove rows with invalid timestamps
    if 'timestamp' in df.columns:
        current_time = pd.Timestamp.now(tz='UTC')
        # Remove future timestamps and very old ones (older than 5 years)
        five_years_ago = current_time - pd.Timedelta(days=5*365)
        df = df[
            df['timestamp'].notna() &
            (df['timestamp'] <= current_time) &
            (df['timestamp'] >= five_years_ago)
        ]

    print(f"Validation complete: {len(df)} valid records remaining")

    return df
```

#### Step 2: Handling Missing Data and Outliers

```python
def preprocess_security_events(df):
    """
    Handle missing data and outliers in security event dataset

    Args:
        df: DataFrame with validated network data

    Returns:
        Preprocessed DataFrame ready for feature engineering
    """
    # Handle missing geolocation data
    if 'country' in df.columns:
        df['country'].fillna('Unknown', inplace=True)

    if 'asn' in df.columns:
        df['asn'].fillna(0, inplace=True)

    # Handle missing protocol information
    if 'protocol' in df.columns:
        df['protocol'].fillna('Unknown', inplace=True)

    # Cap extreme outliers in numerical features (99th percentile)
    numerical_cols = {
        'bytes_sent': 'Bytes sent',
        'bytes_received': 'Bytes received',
        'session_duration': 'Session duration',
        'packet_count': 'Packet count'
    }

    for col, description in numerical_cols.items():
        if col in df.columns:
            q99 = df[col].quantile(0.99)
            outliers_count = (df[col] > q99).sum()

            if outliers_count > 0:
                print(f"Capping {outliers_count} outliers in {description} at {q99:.2f}")
                df[col] = df[col].clip(upper=q99)

            # Fill missing with 0 (assuming no data means no activity)
            df[col].fillna(0, inplace=True)

    # Remove duplicate events (keep first occurrence)
    duplicate_cols = ['src_ip', 'dst_port', 'timestamp']
    if all(col in df.columns for col in duplicate_cols):
        duplicates_before = len(df)
        df.drop_duplicates(subset=duplicate_cols, keep='first', inplace=True)
        duplicates_removed = duplicates_before - len(df)

        if duplicates_removed > 0:
            print(f"Removed {duplicates_removed} duplicate events")

    # Reset index after all filtering
    df.reset_index(drop=True, inplace=True)

    print(f"Preprocessing complete: {len(df)} records ready for feature engineering")

    return df
```

#### Step 3: Data Quality Metrics

```python
def calculate_data_quality_metrics(df):
    """
    Calculate and report data quality metrics

    Args:
        df: DataFrame to analyze

    Returns:
        Dictionary with quality metrics
    """
    metrics = {
        'total_records': len(df),
        'missing_values': df.isnull().sum().to_dict(),
        'duplicate_records': df.duplicated().sum(),
        'timestamp_range': {
            'start': df['timestamp'].min() if 'timestamp' in df.columns else None,
            'end': df['timestamp'].max() if 'timestamp' in df.columns else None
        },
        'unique_sources': df['src_ip'].nunique() if 'src_ip' in df.columns else 0,
        'unique_targets': df['dst_port'].nunique() if 'dst_port' in df.columns else 0
    }

    # Print quality report
    print("=" * 60)
    print("DATA QUALITY REPORT")
    print("=" * 60)
    print(f"Total Records: {metrics['total_records']:,}")
    print(f"Unique Source IPs: {metrics['unique_sources']:,}")
    print(f"Unique Target Ports: {metrics['unique_targets']:,}")
    print(f"Duplicate Records: {metrics['duplicate_records']:,}")

    if metrics['timestamp_range']['start']:
        print(f"Time Range: {metrics['timestamp_range']['start']} to {metrics['timestamp_range']['end']}")

    print("\nMissing Values by Column:")
    for col, count in metrics['missing_values'].items():
        if count > 0:
            percentage = (count / len(df)) * 100
            print(f"  {col}: {count:,} ({percentage:.2f}%)")

    print("=" * 60)

    return metrics
```

## Part 3: Feature Engineering for Threat Detection

Now for the fun part — turning raw data into ML model "food"! Think of this as cooking a gourmet meal from raw ingredients: each feature is like a spice that adds its unique flavor to our understanding of attacks. Let's explore which "recipes" work best:

### 1. Temporal Features

Time-based patterns are crucial for identifying attack campaigns and behavioral anomalies:

```python
def create_temporal_features(df):
    """
    Create time-based features for attack pattern detection

    Args:
        df: DataFrame with timestamp column

    Returns:
        DataFrame with added temporal features
    """
    if 'timestamp' not in df.columns:
        raise ValueError("Timestamp column required for temporal features")

    # Basic time components
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['day_of_month'] = df['timestamp'].dt.day
    df['month'] = df['timestamp'].dt.month

    # Working hours indicator (9 AM - 5 PM on weekdays)
    df['is_working_hours'] = (
        (df['hour'] >= 9) &
        (df['hour'] < 17) &
        (df['day_of_week'] < 5)
    ).astype(int)

    # Weekend indicator
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # Night time indicator (10 PM - 6 AM)
    df['is_night'] = (
        (df['hour'] >= 22) |
        (df['hour'] < 6)
    ).astype(int)

    # Time since first connection from same source
    df['first_seen'] = df.groupby('src_ip')['timestamp'].transform('min')
    df['hours_since_first_seen'] = (
        (df['timestamp'] - df['first_seen']).dt.total_seconds() / 3600
    )

    # Connection frequency features
    df['daily_connection_count'] = df.groupby([
        'src_ip',
        df['timestamp'].dt.date
    ])['src_ip'].transform('count')

    # Hourly connection rate
    df['hourly_connection_count'] = df.groupby([
        'src_ip',
        df['timestamp'].dt.floor('H')
    ])['src_ip'].transform('count')

    # Time between connections (session gaps)
    df_sorted = df.sort_values(['src_ip', 'timestamp'])
    df_sorted['time_since_last_connection'] = df_sorted.groupby('src_ip')['timestamp'].diff().dt.total_seconds()
    df['time_since_last_connection'] = df_sorted['time_since_last_connection']

    # Fill NaN (first connection has no previous connection)
    df['time_since_last_connection'].fillna(0, inplace=True)

    print(f"Created temporal features: hour, day_of_week, is_weekend, connection frequency metrics")

    return df
```

### 2. Behavioral Aggregation Features

Statistical summaries reveal attacker patterns:

```python
def create_behavioral_features(df):
    """
    Create behavioral aggregation features based on source IP patterns

    Args:
        df: DataFrame with network events

    Returns:
        DataFrame with behavioral features
    """
    print("Creating behavioral aggregation features...")

    # Per-source IP aggregations
    source_stats = df.groupby('src_ip').agg({
        'dst_port': ['nunique', 'count'],
        'bytes_sent': ['mean', 'std', 'max', 'sum'],
        'bytes_received': ['mean', 'std', 'max', 'sum'],
        'session_duration': ['mean', 'median', 'max'],
        'protocol': lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown'
    }).reset_index()

    # Flatten column names
    source_stats.columns = [
        'src_ip',
        'unique_ports', 'total_connections',
        'avg_bytes_sent', 'std_bytes_sent', 'max_bytes_sent', 'total_bytes_sent',
        'avg_bytes_received', 'std_bytes_received', 'max_bytes_received', 'total_bytes_received',
        'avg_duration', 'median_duration', 'max_duration',
        'primary_protocol'
    ]

    # Merge back to original dataset
    df = df.merge(source_stats, on='src_ip', how='left')

    # Port scanning indicators
    df['port_diversity'] = df['unique_ports'] / df['total_connections']
    df['is_port_scanner'] = (df['unique_ports'] > 10).astype(int)

    # Connection pattern features
    df['avg_connection_size'] = (df['avg_bytes_sent'] + df['avg_bytes_received'])

    # Bandwidth usage patterns
    df['total_bandwidth'] = df['total_bytes_sent'] + df['total_bytes_received']
    df['bandwidth_asymmetry'] = (
        abs(df['total_bytes_sent'] - df['total_bytes_received']) /
        (df['total_bandwidth'] + 1)  # +1 to avoid division by zero
    )

    # Session behavior patterns
    df['connection_rate'] = df['total_connections'] / (df['hours_since_first_seen'] + 1)

    # Consistency metrics (lower std dev means more consistent behavior)
    df['bytes_consistency'] = df['std_bytes_sent'] / (df['avg_bytes_sent'] + 1)

    print(f"Created {len(source_stats.columns) - 1} behavioral features")

    return df
```

### 3. Geographic and Network Features

Geographic patterns help identify coordinated attacks:

```python
def create_geographic_features(df):
    """
    Create geography-based threat intelligence features

    Args:
        df: DataFrame with geolocation data

    Returns:
        DataFrame with geographic features
    """
    print("Creating geographic and network features...")

    # Country-level threat scoring
    if 'country' in df.columns:
        country_threat_scores = df.groupby('country').agg({
            'src_ip': 'nunique',
            'attack_type': lambda x: (x != 'benign').sum() if 'attack_type' in df.columns else 0
        }).reset_index()

        country_threat_scores.columns = ['country', 'unique_ips_from_country', 'attack_count_from_country']

        country_threat_scores['country_threat_ratio'] = (
            country_threat_scores['attack_count_from_country'] /
            (country_threat_scores['unique_ips_from_country'] + 1)
        )

        df = df.merge(
            country_threat_scores[['country', 'country_threat_ratio', 'unique_ips_from_country']],
            on='country',
            how='left'
        )

    # ASN-based features
    if 'asn' in df.columns:
        asn_stats = df.groupby('asn').agg({
            'src_ip': 'nunique',
            'bytes_sent': 'mean',
            'total_connections': 'sum'
        }).reset_index()

        asn_stats.columns = ['asn', 'unique_ips_per_asn', 'avg_bytes_per_asn', 'total_conn_per_asn']

        df = df.merge(asn_stats, on='asn', how='left', suffixes=('', '_asn'))

    # Protocol distribution features
    if 'protocol' in df.columns:
        protocol_dummies = pd.get_dummies(df['protocol'], prefix='protocol')
        df = pd.concat([df, protocol_dummies], axis=1)

    # Distance from known malicious ranges (simplified example)
    # In production, integrate with threat intelligence feeds
    known_malicious_countries = ['CN', 'RU', 'KP']  # Example
    if 'country' in df.columns:
        df['from_high_risk_country'] = df['country'].isin(known_malicious_countries).astype(int)

    print("Geographic features created successfully")

    return df
```

### 4. Target-Based Features

Analyzing what attackers are targeting:

```python
def create_target_features(df):
    """
    Create features based on attack targets (ports, services)

    Args:
        df: DataFrame with destination port information

    Returns:
        DataFrame with target-based features
    """
    print("Creating target-based features...")

    # Common service ports mapping
    common_ports = {
        22: 'SSH',
        23: 'Telnet',
        80: 'HTTP',
        443: 'HTTPS',
        3306: 'MySQL',
        3389: 'RDP',
        5432: 'PostgreSQL',
        8080: 'HTTP-Alt'
    }

    if 'dst_port' in df.columns:
        df['target_service'] = df['dst_port'].map(common_ports).fillna('Other')

        # Service targeting patterns
        df['targets_ssh'] = (df['dst_port'] == 22).astype(int)
        df['targets_rdp'] = (df['dst_port'] == 3389).astype(int)
        df['targets_web'] = df['dst_port'].isin([80, 443, 8080]).astype(int)
        df['targets_database'] = df['dst_port'].isin([3306, 5432, 1433]).astype(int)

        # Well-known vs ephemeral ports
        df['targets_wellknown_port'] = (df['dst_port'] < 1024).astype(int)
        df['targets_registered_port'] = ((df['dst_port'] >= 1024) & (df['dst_port'] < 49152)).astype(int)
        df['targets_ephemeral_port'] = (df['dst_port'] >= 49152).astype(int)

    print("Target features created successfully")

    return df
```

### Complete Feature Engineering Pipeline

```python
def engineer_all_features(df):
    """
    Complete feature engineering pipeline

    Args:
        df: Raw preprocessed DataFrame

    Returns:
        DataFrame with all engineered features
    """
    print("\n" + "=" * 60)
    print("STARTING FEATURE ENGINEERING PIPELINE")
    print("=" * 60 + "\n")

    # Create copies to avoid modifying original
    df_features = df.copy()

    # Apply feature engineering steps
    df_features = create_temporal_features(df_features)
    df_features = create_behavioral_features(df_features)
    df_features = create_geographic_features(df_features)
    df_features = create_target_features(df_features)

    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING COMPLETE")
    print("=" * 60)
    print(f"Total features: {len(df_features.columns)}")
    print(f"Total records: {len(df_features)}")
    print("=" * 60 + "\n")

    return df_features
```

## Part 4: Machine Learning Model Selection

Time to pick our weapon of choice! Just like in video games where different bosses require different strategies, threat detection needs different ML approaches. Let's figure out which "gear" works best for your specific mission:

### 1. Binary Classification: Attack vs. Benign

For basic threat detection, start with binary classification:

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib

def train_binary_classifier(df, save_model=True):
    """
    Train binary classifier to detect attacks vs benign traffic

    Args:
        df: DataFrame with engineered features
        save_model: Whether to save trained model to disk

    Returns:
        Trained model and performance metrics
    """
    print("\n" + "=" * 60)
    print("TRAINING BINARY CLASSIFIER (Attack vs Benign)")
    print("=" * 60 + "\n")

    # Define feature columns
    feature_cols = [
        # Temporal features
        'hour', 'day_of_week', 'is_weekend', 'is_night',
        'hours_since_first_seen', 'daily_connection_count',

        # Behavioral features
        'unique_ports', 'total_connections', 'port_diversity',
        'avg_bytes_sent', 'avg_bytes_received', 'avg_duration',
        'connection_rate', 'bandwidth_asymmetry',

        # Geographic features
        'country_threat_ratio', 'from_high_risk_country',

        # Target features
        'targets_ssh', 'targets_web', 'targets_database'
    ]

    # Filter to available columns
    available_features = [col for col in feature_cols if col in df.columns]

    print(f"Using {len(available_features)} features for training")

    # Prepare features and labels
    X = df[available_features].fillna(0)

    # Create binary label (assuming 'attack_type' column exists)
    if 'attack_type' in df.columns:
        y = (df['attack_type'] != 'benign').astype(int)
    elif 'label' in df.columns:
        y = (df['label'] != 0).astype(int)
    else:
        raise ValueError("No label column found (need 'attack_type' or 'label')")

    # Check class distribution
    print(f"Class distribution:")
    print(f"  Benign: {(y == 0).sum()} ({(y == 0).sum() / len(y) * 100:.2f}%)")
    print(f"  Attack: {(y == 1).sum()} ({(y == 1).sum() / len(y) * 100:.2f}%)")

    # Split data (stratified to maintain class distribution)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")

    # Train Random Forest model
    print("\nTraining Random Forest classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',  # Handle imbalanced data
        random_state=42,
        n_jobs=-1  # Use all CPU cores
    )

    rf_model.fit(X_train, y_train)

    # Evaluate on test set
    print("\nEvaluating model...")
    y_pred = rf_model.predict(X_test)
    y_pred_proba = rf_model.predict_proba(X_test)[:, 1]

    # Print classification report
    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=['Benign', 'Attack']
    ))

    # Calculate ROC-AUC
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    print(f"ROC-AUC Score: {roc_auc:.4f}")

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': available_features,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)

    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10).to_string(index=False))

    # Save model
    if save_model:
        model_path = 'models/binary_classifier_rf.pkl'
        joblib.dump(rf_model, model_path)
        print(f"\nModel saved to: {model_path}")

        # Save feature list
        feature_path = 'models/binary_classifier_features.pkl'
        joblib.dump(available_features, feature_path)
        print(f"Feature list saved to: {feature_path}")

    return rf_model, {
        'roc_auc': roc_auc,
        'features': available_features,
        'feature_importance': feature_importance
    }
```

### 2. Multi-Class Attack Classification

For detailed threat categorization:

```python
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

def train_multiclass_classifier(df, save_model=True):
    """
    Train multi-class classifier to categorize attack types

    Args:
        df: DataFrame with engineered features
        save_model: Whether to save trained model

    Returns:
        Trained model, label encoder, and metrics
    """
    print("\n" + "=" * 60)
    print("TRAINING MULTI-CLASS CLASSIFIER (Attack Type Categorization)")
    print("=" * 60 + "\n")

    # Encode attack types
    le = LabelEncoder()

    if 'attack_type' in df.columns:
        df['attack_label'] = le.fit_transform(df['attack_type'])
    elif 'label' in df.columns:
        df['attack_label'] = le.fit_transform(df['label'])
    else:
        raise ValueError("No attack type column found")

    print(f"Attack types found: {len(le.classes_)}")
    for idx, attack_type in enumerate(le.classes_):
        count = (df['attack_label'] == idx).sum()
        print(f"  {attack_type}: {count} samples")

    # Feature selection
    feature_cols = [
        # Temporal
        'hour', 'day_of_week', 'is_weekend', 'is_night',
        'daily_connection_count', 'hourly_connection_count',

        # Behavioral
        'unique_ports', 'total_connections', 'port_diversity',
        'avg_bytes_sent', 'std_bytes_sent',
        'avg_bytes_received', 'std_bytes_received',
        'avg_duration', 'median_duration',
        'connection_rate', 'bytes_consistency',

        # Geographic
        'country_threat_ratio', 'from_high_risk_country',

        # Target
        'targets_ssh', 'targets_rdp', 'targets_web', 'targets_database'
    ]

    available_features = [col for col in feature_cols if col in df.columns]

    X = df[available_features].fillna(0)
    y = df['attack_label']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # Train XGBoost for multi-class
    print(f"\nTraining XGBoost classifier with {len(available_features)} features...")

    xgb_model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss'
    )

    xgb_model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    # Evaluate
    y_pred = xgb_model.predict(X_test)

    print("\nMulti-Class Classification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=le.classes_
    ))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix:")
    print(cm)

    # Save model
    if save_model:
        model_path = 'models/multiclass_classifier_xgb.pkl'
        joblib.dump(xgb_model, model_path)
        print(f"\nModel saved to: {model_path}")

        encoder_path = 'models/label_encoder.pkl'
        joblib.dump(le, encoder_path)
        print(f"Label encoder saved to: {encoder_path}")

    return xgb_model, le, {'confusion_matrix': cm}
```

### 3. Anomaly Detection for Zero-Day Threats

Unsupervised learning identifies previously unseen attack patterns:

```python
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def train_anomaly_detector(df, contamination=0.05, save_model=True):
    """
    Train anomaly detection model for zero-day threat detection

    Args:
        df: DataFrame with engineered features
        contamination: Expected proportion of anomalies (0.05 = 5%)
        save_model: Whether to save trained model

    Returns:
        Trained model, scaler, and anomaly scores
    """
    print("\n" + "=" * 60)
    print("TRAINING ANOMALY DETECTOR (Zero-Day Threat Detection)")
    print("=" * 60 + "\n")

    # Use only benign traffic for training (if available)
    if 'attack_type' in df.columns:
        benign_data = df[df['attack_type'] == 'benign']
        print(f"Training on {len(benign_data)} benign samples")
    else:
        benign_data = df
        print(f"Training on {len(benign_data)} total samples (no labels available)")

    # Feature selection for anomaly detection
    feature_cols = [
        'unique_ports', 'total_connections', 'port_diversity',
        'avg_bytes_sent', 'avg_bytes_received',
        'avg_duration', 'connection_rate',
        'hours_since_first_seen', 'daily_connection_count'
    ]

    available_features = [col for col in feature_cols if col in df.columns]

    X_benign = benign_data[available_features].fillna(0)

    # Scale features (important for distance-based anomaly detection)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_benign)

    print(f"Training Isolation Forest with contamination={contamination}...")

    # Train Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        max_samples='auto',
        random_state=42,
        n_jobs=-1
    )

    iso_forest.fit(X_scaled)

    # Test on full dataset
    print("\nTesting on full dataset...")
    X_all = df[available_features].fillna(0)
    X_all_scaled = scaler.transform(X_all)

    # Get anomaly scores (lower = more anomalous)
    anomaly_scores = iso_forest.decision_function(X_all_scaled)
    predictions = iso_forest.predict(X_all_scaled)

    df['anomaly_score'] = anomaly_scores
    df['is_anomaly'] = (predictions == -1).astype(int)

    # Statistics
    anomaly_count = df['is_anomaly'].sum()
    anomaly_percentage = (anomaly_count / len(df)) * 100

    print(f"\nAnomalies detected: {anomaly_count} ({anomaly_percentage:.2f}%)")

    # If we have labels, evaluate performance
    if 'attack_type' in df.columns:
        actual_attacks = (df['attack_type'] != 'benign').astype(int)
        detected_anomalies = df['is_anomaly']

        from sklearn.metrics import precision_score, recall_score, f1_score

        precision = precision_score(actual_attacks, detected_anomalies)
        recall = recall_score(actual_attacks, detected_anomalies)
        f1 = f1_score(actual_attacks, detected_anomalies)

        print(f"\nPerformance vs Known Attacks:")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall: {recall:.4f}")
        print(f"  F1-Score: {f1:.4f}")

    # Save model
    if save_model:
        model_path = 'models/anomaly_detector_isoforest.pkl'
        joblib.dump(iso_forest, model_path)
        print(f"\nModel saved to: {model_path}")

        scaler_path = 'models/anomaly_scaler.pkl'
        joblib.dump(scaler, scaler_path)
        print(f"Scaler saved to: {scaler_path}")

    return iso_forest, scaler, df[['anomaly_score', 'is_anomaly']]
```

## Part 5: Model Deployment and Production

### Real-Time Inference Pipeline

Deploy models for real-time threat detection:

```python
import joblib
from datetime import datetime
import numpy as np

class ThreatDetectionPipeline:
    """
    Production-ready threat detection pipeline
    """

    def __init__(self, model_path, scaler_path=None, feature_list_path=None):
        """
        Initialize pipeline with trained models

        Args:
            model_path: Path to trained model file
            scaler_path: Path to feature scaler (optional)
            feature_list_path: Path to feature list file (optional)
        """
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path) if scaler_path else None
        self.feature_list = joblib.load(feature_list_path) if feature_list_path else None

        print(f"Loaded model from: {model_path}")
        if self.scaler:
            print(f"Loaded scaler from: {scaler_path}")
        if self.feature_list:
            print(f"Using {len(self.feature_list)} features")

    def preprocess_event(self, event):
        """
        Convert raw security event to feature vector

        Args:
            event: Dictionary with security event data

        Returns:
            Feature vector ready for model prediction
        """
        # Extract temporal features
        if 'timestamp' in event:
            dt = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
            hour = dt.hour
            day_of_week = dt.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            is_night = 1 if (hour >= 22 or hour < 6) else 0
        else:
            hour = datetime.now().hour
            day_of_week = datetime.now().weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            is_night = 1 if (hour >= 22 or hour < 6) else 0

        # Build feature dictionary
        features = {
            # Temporal
            'hour': hour,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'is_night': is_night,

            # Behavioral
            'unique_ports': event.get('unique_ports', 1),
            'total_connections': event.get('connection_count', 1),
            'port_diversity': event.get('port_diversity', 0),
            'avg_bytes_sent': event.get('bytes_sent', 0),
            'avg_bytes_received': event.get('bytes_received', 0),
            'avg_duration': event.get('session_duration', 0),
            'connection_rate': event.get('connection_rate', 0),

            # Geographic
            'country_threat_ratio': event.get('country_threat_ratio', 0),
            'from_high_risk_country': event.get('from_high_risk_country', 0),

            # Target
            'targets_ssh': 1 if event.get('dst_port') == 22 else 0,
            'targets_web': 1 if event.get('dst_port') in [80, 443] else 0,
            'targets_database': 1 if event.get('dst_port') in [3306, 5432] else 0,
        }

        # If we have a specific feature list, use only those features
        if self.feature_list:
            feature_vector = np.array([features.get(f, 0) for f in self.feature_list])
        else:
            feature_vector = np.array(list(features.values()))

        feature_vector = feature_vector.reshape(1, -1)

        # Apply scaling if scaler is available
        if self.scaler:
            feature_vector = self.scaler.transform(feature_vector)

        return feature_vector

    def predict_threat(self, event):
        """
        Predict threat level for a security event

        Args:
            event: Security event dictionary

        Returns:
            Threat assessment dictionary
        """
        features = self.preprocess_event(event)

        # Get prediction probability
        if hasattr(self.model, 'predict_proba'):
            threat_probability = self.model.predict_proba(features)[0][1]
        else:
            # For models without predict_proba (like Isolation Forest)
            prediction = self.model.predict(features)[0]
            threat_probability = 1.0 if prediction == -1 else 0.0

        # Determine risk level
        if threat_probability > 0.8:
            risk_level = 'critical'
        elif threat_probability > 0.6:
            risk_level = 'high'
        elif threat_probability > 0.4:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        return {
            'threat_probability': float(threat_probability),
            'is_threat': threat_probability > 0.5,
            'risk_level': risk_level,
            'timestamp': datetime.now().isoformat(),
            'src_ip': event.get('src_ip', 'unknown'),
            'dst_port': event.get('dst_port', 0)
        }

    def batch_predict(self, events):
        """
        Predict threats for multiple events

        Args:
            events: List of security event dictionaries

        Returns:
            List of threat assessments
        """
        return [self.predict_threat(event) for event in events]
```

### Usage Examples

```python
# Initialize pipeline
pipeline = ThreatDetectionPipeline(
    model_path='models/binary_classifier_rf.pkl',
    feature_list_path='models/binary_classifier_features.pkl'
)

# Single event prediction
sample_event = {
    'timestamp': '2025-09-24T14:30:00Z',
    'src_ip': '203.0.113.5',
    'dst_port': 22,
    'bytes_sent': 2048,
    'bytes_received': 512,
    'session_duration': 45.2,
    'unique_ports': 5,
    'connection_count': 15,
    'port_diversity': 0.33,
    'country_threat_ratio': 0.75,
    'from_high_risk_country': 1
}

result = pipeline.predict_threat(sample_event)
print("Threat Assessment:")
print(f"  Source IP: {result['src_ip']}")
print(f"  Threat Probability: {result['threat_probability']:.2%}")
print(f"  Risk Level: {result['risk_level']}")
print(f"  Is Threat: {result['is_threat']}")
```

## Part 6: Working with Hugging Face Datasets

### Dataset Arsenal: Your Threat Intelligence Toolkit

I've assembled a complete collection of real honeypot datasets on Hugging Face. Each dataset tells its own "story" about how attackers behave in the wild:

#### The Big Boss: cyber-security-events-full

**Dataset**: `mranv/cyber-security-events-full`

- **Size**: 772K events — the heavyweight champion for serious experiments
- **What's Inside**: A full-length movie about cyberattacks with rich feature sets
- **Features**: Network flows, behavioral patterns, geographic data, IP reputation
- **Perfect For**: Training production-ready threat detection models
- **Special Power**: Like the Wikipedia of attacks — everything's in here!

```python
from datasets import load_dataset

# Load the comprehensive dataset
dataset = load_dataset("mranv/cyber-security-events-full")
df_full = dataset['train'].to_pandas()

print(f"Loaded {len(df_full)} security events")
print(f"Features: {list(df_full.columns)}")
```

#### The Time Whisperer: attacks-daily

**Dataset**: `mranv/attacks-daily`

- **Size**: 676K records — laser-focused on temporal patterns
- **What's Inside**: Daily chronicles of attacks with precise timestamps
- **Features**: Time series attacks, seasonal patterns, activity cycles
- **Perfect For**: Predicting "when" the next attack will happen
- **Special Power**: Shows that even hackers have daily routines!

```python
# Load daily attack patterns
dataset_daily = load_dataset("mranv/attacks-daily")
df_daily = dataset_daily['train'].to_pandas()

# Analyze temporal patterns
df_daily['timestamp'] = pd.to_datetime(df_daily['timestamp'])
df_daily['hour'] = df_daily['timestamp'].dt.hour

attack_by_hour = df_daily.groupby('hour').size()
print("Attacks by hour:")
print(attack_by_hour)
```

#### The Compact Trainer: cyber-security-events

**Dataset**: `mranv/cyber-security-events`

- **Size**: 15.1K events — perfect size for rapid experimentation
- **What's Inside**: Curated selection of the most interesting attacks
- **Features**: Balanced mix of different attack types
- **Perfect For**: First steps and quick prototyping
- **Special Power**: Like a starter pack for ML researchers!

```python
# Load compact dataset for quick experiments
dataset_compact = load_dataset("mranv/cyber-security-events")
df_compact = dataset_compact['train'].to_pandas()

print(f"Compact dataset: {len(df_compact)} events")
print(f"Attack types: {df_compact['attack_type'].value_counts()}")
```

#### The Intrusion Specialist: network-intrusion-detection

**Dataset**: `mranv/network-intrusion-detection`

- **Size**: 100 records — small but mighty
- **What's Inside**: High-quality examples of network intrusions
- **Features**: Clear classifications, samples for IDS systems
- **Perfect For**: Intrusion detection system developers
- **Special Power**: Each record is a textbook example!

### Complete Pipeline with Hugging Face Datasets

```python
from datasets import load_dataset
import pandas as pd

def load_and_prepare_dataset(dataset_name="mranv/cyber-security-events-full"):
    """
    Load dataset from Hugging Face and prepare for ML

    Args:
        dataset_name: Hugging Face dataset identifier

    Returns:
        Prepared DataFrame ready for model training
    """
    print(f"Loading dataset: {dataset_name}")

    # Load dataset
    dataset = load_dataset(dataset_name)

    # Convert to pandas
    df = dataset['train'].to_pandas()

    print(f"Loaded {len(df)} records with {len(df.columns)} features")

    # Apply preprocessing pipeline
    print("\nApplying preprocessing...")
    df = validate_network_data(df)
    df = preprocess_security_events(df)

    # Calculate quality metrics
    metrics = calculate_data_quality_metrics(df)

    # Engineer features
    print("\nEngineering features...")
    df = engineer_all_features(df)

    print(f"\nDataset ready: {len(df)} records, {len(df.columns)} features")

    return df

# Example usage
df = load_and_prepare_dataset("mranv/cyber-security-events-full")

# Train models
binary_model, binary_metrics = train_binary_classifier(df)
multiclass_model, label_encoder, mc_metrics = train_multiclass_classifier(df)
anomaly_model, anomaly_scaler, anomaly_scores = train_anomaly_detector(df)
```

## Part 7: macOS M1/M2/M4 Compatibility

### Installing Dependencies for Apple Silicon

When running this code on Apple Silicon Macs (M1, M2, M4), you may encounter XGBoost installation issues. Here's how to resolve them:

```bash
# Install OpenMP runtime (required for XGBoost)
brew install libomp

# Install Python packages
pip install pandas numpy scikit-learn datasets xgboost matplotlib seaborn

# If you encounter issues with XGBoost, try:
pip uninstall xgboost
pip install xgboost --no-cache-dir --no-binary xgboost

# Alternative: Install from conda-forge (recommended for M1/M2/M4)
conda install -c conda-forge xgboost
```

### Troubleshooting Common Issues

**Issue 1: XGBoostError: XGBoost Library (libxgboost.dylib) could not be loaded**

```bash
# Solution
brew install libomp
export LDFLAGS="-L/opt/homebrew/opt/libomp/lib"
export CPPFLAGS="-I/opt/homebrew/opt/libomp/include"

pip install xgboost --no-cache-dir
```

**Issue 2: Performance issues on Apple Silicon**

```bash
# Ensure you're using native ARM64 Python
python -c "import platform; print(platform.machine())"
# Should output: arm64

# If output is x86_64, you're running through Rosetta
# Install native Python:
brew install python@3.11
```

**Issue 3: NumPy/Pandas performance on M-series chips**

```bash
# Use optimized versions
pip install --upgrade numpy pandas

# For maximum performance, use conda
conda install numpy pandas scikit-learn -c conda-forge
```

### Optimized Setup Script for Apple Silicon

```bash
#!/bin/bash
# setup_apple_silicon.sh

echo "Setting up ML environment for Apple Silicon..."

# Check architecture
if [[ $(uname -m) != "arm64" ]]; then
    echo "Warning: Not running on ARM64 architecture"
    exit 1
fi

# Install Homebrew dependencies
echo "Installing Homebrew dependencies..."
brew install libomp

# Set environment variables
export LDFLAGS="-L/opt/homebrew/opt/libomp/lib"
export CPPFLAGS="-I/opt/homebrew/opt/libomp/include"

# Install Python packages
echo "Installing Python packages..."
pip install --upgrade pip
pip install pandas numpy scikit-learn matplotlib seaborn jupyter
pip install datasets huggingface_hub
pip install xgboost --no-cache-dir

echo "Installation complete!"
echo "Testing XGBoost..."
python -c "import xgboost; print(f'XGBoost version: {xgboost.__version__}')"
```

## Part 8: Best Practices and Production Considerations

### 1. Dataset Quality and Labeling

```python
def validate_labels(df):
    """
    Validate and verify dataset labels

    Args:
        df: DataFrame with labels

    Returns:
        Validation report
    """
    if 'attack_type' not in df.columns:
        return {'error': 'No labels found'}

    label_stats = {
        'total_samples': len(df),
        'label_distribution': df['attack_type'].value_counts().to_dict(),
        'missing_labels': df['attack_type'].isnull().sum(),
        'unique_labels': df['attack_type'].nunique()
    }

    # Check for label quality issues
    issues = []

    # Check for severely imbalanced classes
    min_class_percentage = (df['attack_type'].value_counts().min() / len(df)) * 100
    if min_class_percentage < 1:
        issues.append(f"Severely imbalanced: smallest class is {min_class_percentage:.2f}%")

    # Check for missing labels
    if label_stats['missing_labels'] > 0:
        issues.append(f"{label_stats['missing_labels']} samples with missing labels")

    label_stats['issues'] = issues

    return label_stats
```

### 2. Model Drift Monitoring

```python
import json
from datetime import datetime

class ModelMonitor:
    """
    Monitor model performance and detect drift
    """

    def __init__(self, baseline_metrics):
        """
        Initialize with baseline metrics from training

        Args:
            baseline_metrics: Dict with baseline performance metrics
        """
        self.baseline = baseline_metrics
        self.history = []

    def log_predictions(self, y_true, y_pred, timestamp=None):
        """
        Log prediction results for monitoring

        Args:
            y_true: True labels
            y_pred: Predicted labels
            timestamp: Prediction timestamp
        """
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

        metrics = {
            'timestamp': timestamp or datetime.now().isoformat(),
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1': f1_score(y_true, y_pred, average='weighted', zero_division=0),
            'sample_count': len(y_true)
        }

        self.history.append(metrics)

        # Check for drift
        self.detect_drift(metrics)

        return metrics

    def detect_drift(self, current_metrics, threshold=0.1):
        """
        Detect if model performance has degraded

        Args:
            current_metrics: Current performance metrics
            threshold: Acceptable degradation threshold (default 10%)

        Returns:
            Boolean indicating drift detected
        """
        drift_detected = False
        alerts = []

        for metric in ['accuracy', 'precision', 'recall', 'f1']:
            if metric in self.baseline and metric in current_metrics:
                baseline_value = self.baseline[metric]
                current_value = current_metrics[metric]
                degradation = (baseline_value - current_value) / baseline_value

                if degradation > threshold:
                    drift_detected = True
                    alerts.append(
                        f"{metric.upper()} degraded by {degradation*100:.1f}% "
                        f"(baseline: {baseline_value:.3f}, current: {current_value:.3f})"
                    )

        if drift_detected:
            print("⚠️  MODEL DRIFT DETECTED!")
            for alert in alerts:
                print(f"   - {alert}")
            print("   Consider retraining the model with recent data.")

        return drift_detected

    def save_history(self, filepath='monitoring/model_history.json'):
        """
        Save monitoring history to file

        Args:
            filepath: Path to save history
        """
        with open(filepath, 'w') as f:
            json.dump(self.history, f, indent=2)

        print(f"Monitoring history saved to: {filepath}")
```

### 3. SIEM Integration

```python
import requests
import json

class SIEMIntegration:
    """
    Integration with SIEM systems (Splunk, Wazuh, etc.)
    """

    def __init__(self, siem_url, api_key):
        """
        Initialize SIEM integration

        Args:
            siem_url: SIEM API endpoint
            api_key: Authentication key
        """
        self.siem_url = siem_url
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def send_alert(self, threat_assessment, event_data):
        """
        Send ML threat assessment to SIEM

        Args:
            threat_assessment: Model prediction result
            event_data: Original security event
        """
        alert_payload = {
            'timestamp': datetime.now().isoformat(),
            'source': 'ML_Threat_Detector',
            'severity': self.map_risk_to_severity(threat_assessment['risk_level']),
            'threat_probability': threat_assessment['threat_probability'],
            'risk_level': threat_assessment['risk_level'],
            'src_ip': event_data.get('src_ip'),
            'dst_port': event_data.get('dst_port'),
            'description': f"ML-detected threat from {event_data.get('src_ip')} "
                          f"with {threat_assessment['threat_probability']:.0%} confidence",
            'raw_event': event_data
        }

        try:
            response = requests.post(
                f"{self.siem_url}/alerts",
                headers=self.headers,
                json=alert_payload,
                timeout=10
            )

            if response.status_code == 200:
                print(f"✓ Alert sent to SIEM: {threat_assessment['risk_level']} risk")
            else:
                print(f"✗ Failed to send alert: {response.status_code}")

        except Exception as e:
            print(f"✗ Error sending alert to SIEM: {str(e)}")

    def map_risk_to_severity(self, risk_level):
        """
        Map ML risk level to SIEM severity

        Args:
            risk_level: ML risk assessment (low/medium/high/critical)

        Returns:
            SIEM severity level
        """
        mapping = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        }

        return mapping.get(risk_level, 1)
```

## Conclusion

Congratulations! You've mastered the complete journey from raw honeypot data to production-ready ML threat detection systems. Let's recap what you've accomplished:

### Key Achievements

✅ **Data Preprocessing** - Validated, cleaned, and prepared real honeypot datasets

✅ **Feature Engineering** - Created temporal, behavioral, geographic, and target-based features

✅ **Model Training** - Built binary classifiers, multi-class categorizers, and anomaly detectors

✅ **Production Deployment** - Implemented real-time inference pipelines

✅ **SIEM Integration** - Connected ML models with security operations

✅ **Monitoring & Maintenance** - Set up drift detection and performance tracking

### The Complete Workflow

```
Raw Honeypot Data
       ↓
Data Validation & Cleaning
       ↓
Feature Engineering
       ↓
Model Training (Binary/Multi-class/Anomaly)
       ↓
Deployment Pipeline
       ↓
Real-time Threat Detection
       ↓
SIEM Integration & Alerting
       ↓
Monitoring & Retraining
```

### What Makes This Approach Powerful

1. **Real-World Data**: Honeypots capture actual attacker behavior, not synthetic scenarios
2. **Multiple Detection Layers**: Binary, multi-class, and anomaly detection provide comprehensive coverage
3. **Production-Ready**: Complete pipeline from data to deployment
4. **Adaptable**: Easy to customize for your specific environment
5. **Cost-Effective**: Open-source tools and free datasets

### Next Steps

#### Immediate Actions

1. **Download Datasets**: Start with `mranv/cyber-security-events` for quick experiments
2. **Run the Code**: Execute the complete pipeline on your local machine
3. **Experiment**: Try different models and feature combinations
4. **Deploy**: Set up real-time inference in your environment

#### Advanced Enhancements

1. **Deep Learning**: Implement LSTM or Transformer models for sequence analysis
2. **Ensemble Methods**: Combine multiple models for better accuracy
3. **Transfer Learning**: Fine-tune pre-trained models on your data
4. **AutoML**: Automated hyperparameter tuning and model selection
5. **Explainable AI**: Add SHAP values for model interpretability

### Resources

#### Code Repository

All code from this guide is available on GitHub:
```bash
git clone https://github.com/mranv/ml-threat-intelligence
cd ml-threat-intelligence
pip install -r requirements.txt
```

#### Datasets on Hugging Face

- 🔗 [cyber-security-events-full](https://huggingface.co/datasets/mranv/cyber-security-events-full)
- 🔗 [attacks-daily](https://huggingface.co/datasets/mranv/attacks-daily)
- 🔗 [cyber-security-events](https://huggingface.co/datasets/mranv/cyber-security-events)
- 🔗 [network-intrusion-detection](https://huggingface.co/datasets/mranv/network-intrusion-detection)

#### Community and Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Share your implementations and ask questions
- **Pull Requests**: Contribute improvements

### Final Thoughts

Machine learning is transforming cybersecurity from reactive to proactive defense. By combining real honeypot data with modern ML techniques, you can detect threats that traditional signature-based systems miss entirely.

The key to success is continuous improvement: keep collecting new data, monitoring model performance, and adapting to emerging threats. Security is an ongoing journey, and you now have the tools to stay ahead.

Remember: the attackers are always evolving. Your models should too. 🛡️🤖

**Happy Threat Hunting!**

---

**Author**: Anubhav Gain
**Last Updated**: October 4, 2025
**Version**: 1.0
**License**: MIT

**Disclaimer**: This guide is for educational and defensive security purposes. Always ensure you have proper authorization before deploying security systems and collecting network data. Comply with all applicable laws and regulations regarding data privacy and security monitoring.
