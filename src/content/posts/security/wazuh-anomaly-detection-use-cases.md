---
author: Anubhav Gain
pubDatetime: 2025-01-28T17:45:00+05:30
modDatetime: 2025-01-28T17:45:00+05:30
title: Wazuh Anomaly Detection Use Cases - Advanced Security Monitoring
slug: wazuh-anomaly-detection-use-cases
featured: false
draft: false
tags:
  - wazuh
  - anomaly-detection
  - security
  - siem
  - threat-detection
  - machine-learning
  - monitoring
  - use-cases
category: Security
description: Comprehensive guide to implementing anomaly detection use cases in Wazuh, covering behavioral analysis, statistical anomalies, machine learning integration, and real-world security scenarios
---

# Wazuh Anomaly Detection Use Cases: Advanced Security Monitoring

This guide explores advanced anomaly detection use cases in Wazuh, demonstrating how to leverage its capabilities for identifying unusual patterns, behaviors, and potential security threats that traditional signature-based detection might miss.

## Overview

Anomaly detection in Wazuh goes beyond simple rule matching, employing statistical analysis, behavioral patterns, and machine learning to identify:

- Unusual user behaviors
- Abnormal system activities
- Network traffic anomalies
- Application behavior deviations
- Data exfiltration attempts
- Insider threats
- Zero-day attack patterns

## Core Anomaly Detection Components

### 1. Statistical Analysis Engine

Wazuh uses statistical analysis to establish baselines and detect deviations:

```xml
<!-- /var/ossec/etc/rules/anomaly_detection.xml -->
<group name="anomaly,statistical">

  <!-- Unusual login times detection -->
  <rule id="100001" level="10">
    <if_sid>5501</if_sid>
    <time>21:00 - 06:00</time>
    <description>Successful login during non-business hours</description>
    <options>no_full_log</options>
    <group>anomaly,authentication</group>
  </rule>

  <!-- Abnormal number of failed logins -->
  <rule id="100002" level="12" frequency="10" timeframe="120">
    <if_matched_sid>5503</if_matched_sid>
    <description>High number of failed login attempts - possible brute force</description>
    <mitre>
      <id>T1110</id>
    </mitre>
    <group>anomaly,authentication,brute_force</group>
  </rule>

  <!-- Unusual process execution frequency -->
  <rule id="100003" level="8" frequency="50" timeframe="60">
    <if_sid>5901</if_sid>
    <same_field>process.name</same_field>
    <description>Abnormally high process execution rate detected</description>
    <group>anomaly,process</group>
  </rule>

</group>
```

### 2. Behavioral Pattern Detection

Implement behavioral analysis for user and system activities:

```python
#!/usr/bin/env python3
# /var/ossec/integrations/behavioral_anomaly.py

import json
import sys
import time
import numpy as np
from collections import defaultdict
from datetime import datetime, timedelta

class BehavioralAnomalyDetector:
    def __init__(self):
        self.user_baselines = defaultdict(lambda: {
            'login_times': [],
            'commands': defaultdict(int),
            'files_accessed': set(),
            'network_connections': defaultdict(int),
            'data_volume': []
        })
        self.window_size = 7  # days
        self.anomaly_threshold = 2.5  # standard deviations

    def process_alert(self, alert):
        """Process incoming alert for anomaly detection"""
        alert_data = json.loads(alert)

        # Extract relevant fields
        user = alert_data.get('data', {}).get('srcuser', 'unknown')
        timestamp = alert_data.get('timestamp', '')
        rule_id = alert_data.get('rule', {}).get('id', '')

        # Detect anomalies based on rule type
        anomalies = []

        if rule_id in ['5501', '5715']:  # Login events
            anomaly = self.detect_login_anomaly(user, timestamp)
            if anomaly:
                anomalies.append(anomaly)

        elif rule_id.startswith('59'):  # Process execution
            command = alert_data.get('data', {}).get('command', '')
            anomaly = self.detect_command_anomaly(user, command)
            if anomaly:
                anomalies.append(anomaly)

        elif rule_id in ['550', '551', '552']:  # File access
            file_path = alert_data.get('data', {}).get('path', '')
            anomaly = self.detect_file_access_anomaly(user, file_path)
            if anomaly:
                anomalies.append(anomaly)

        elif rule_id.startswith('86'):  # Network activity
            dest_ip = alert_data.get('data', {}).get('dstip', '')
            bytes_sent = alert_data.get('data', {}).get('bytes', 0)
            anomaly = self.detect_network_anomaly(user, dest_ip, bytes_sent)
            if anomaly:
                anomalies.append(anomaly)

        return anomalies

    def detect_login_anomaly(self, user, timestamp):
        """Detect unusual login patterns"""
        try:
            login_hour = datetime.fromisoformat(timestamp).hour
            baseline = self.user_baselines[user]['login_times']

            if len(baseline) > 20:  # Need sufficient data
                mean_hour = np.mean(baseline)
                std_hour = np.std(baseline)

                if abs(login_hour - mean_hour) > self.anomaly_threshold * std_hour:
                    return {
                        'type': 'unusual_login_time',
                        'user': user,
                        'severity': 'high',
                        'details': f'Login at {login_hour}:00 deviates from normal pattern',
                        'baseline_mean': mean_hour,
                        'baseline_std': std_hour
                    }

            # Update baseline
            self.user_baselines[user]['login_times'].append(login_hour)

        except Exception as e:
            sys.stderr.write(f"Error in login anomaly detection: {e}\n")

        return None

    def detect_command_anomaly(self, user, command):
        """Detect unusual command execution"""
        command_base = command.split()[0] if command else 'unknown'
        user_commands = self.user_baselines[user]['commands']

        # Check if command is rare for this user
        total_commands = sum(user_commands.values())
        command_frequency = user_commands.get(command_base, 0)

        if total_commands > 100:  # Need sufficient data
            expected_frequency = 1.0 / len(user_commands) if user_commands else 0
            actual_frequency = command_frequency / total_commands

            if actual_frequency < expected_frequency * 0.1:  # Rare command
                anomaly = {
                    'type': 'rare_command_execution',
                    'user': user,
                    'severity': 'medium',
                    'details': f'Unusual command executed: {command_base}',
                    'frequency': actual_frequency,
                    'expected': expected_frequency
                }

                # Check for suspicious patterns
                suspicious_patterns = [
                    'wget', 'curl', 'nc', 'ncat', 'ssh-keygen',
                    'base64', 'xxd', 'dd', 'tcpdump', 'nmap'
                ]

                if any(pattern in command_base.lower() for pattern in suspicious_patterns):
                    anomaly['severity'] = 'high'
                    anomaly['details'] += ' - Potentially suspicious command'

                return anomaly

        # Update baseline
        user_commands[command_base] += 1
        return None

    def detect_file_access_anomaly(self, user, file_path):
        """Detect unusual file access patterns"""
        user_files = self.user_baselines[user]['files_accessed']

        # Check for sensitive file access
        sensitive_paths = [
            '/etc/passwd', '/etc/shadow', '/etc/sudoers',
            '/.ssh/', '/var/log/', '/etc/ssl/',
            '.key', '.pem', '.crt', '.p12'
        ]

        for sensitive in sensitive_paths:
            if sensitive in file_path and file_path not in user_files:
                return {
                    'type': 'sensitive_file_access',
                    'user': user,
                    'severity': 'high',
                    'details': f'First time access to sensitive file: {file_path}',
                    'file': file_path
                }

        # Check for unusual directory traversal
        if '../' in file_path or file_path.count('/') > 10:
            return {
                'type': 'directory_traversal_attempt',
                'user': user,
                'severity': 'high',
                'details': f'Suspicious file path pattern: {file_path}',
                'file': file_path
            }

        # Update baseline
        user_files.add(file_path)
        return None

    def detect_network_anomaly(self, user, dest_ip, bytes_sent):
        """Detect unusual network behavior"""
        user_network = self.user_baselines[user]['network_connections']
        user_data = self.user_baselines[user]['data_volume']

        # Check for new destination
        if dest_ip and dest_ip not in user_network:
            # Check if it's a suspicious destination
            if self.is_suspicious_destination(dest_ip):
                return {
                    'type': 'suspicious_network_destination',
                    'user': user,
                    'severity': 'critical',
                    'details': f'Connection to suspicious IP: {dest_ip}',
                    'destination': dest_ip
                }

        # Check for data exfiltration
        if bytes_sent > 0:
            user_data.append(bytes_sent)

            if len(user_data) > 20:
                mean_bytes = np.mean(user_data)
                std_bytes = np.std(user_data)

                if bytes_sent > mean_bytes + (self.anomaly_threshold * std_bytes):
                    return {
                        'type': 'potential_data_exfiltration',
                        'user': user,
                        'severity': 'critical',
                        'details': f'Unusually large data transfer: {bytes_sent} bytes',
                        'bytes_sent': bytes_sent,
                        'baseline_mean': mean_bytes,
                        'baseline_std': std_bytes
                    }

        # Update baseline
        user_network[dest_ip] += 1
        return None

    def is_suspicious_destination(self, ip):
        """Check if IP is in suspicious ranges"""
        suspicious_ranges = [
            '10.0.0.0/8',     # Private range (unusual for external)
            '172.16.0.0/12',  # Private range
            '192.168.0.0/16', # Private range
            # Add known malicious IPs/ranges
        ]

        # Implement IP range checking logic
        # This is a simplified example
        return any(ip.startswith(range.split('/')[0].rsplit('.', 1)[0])
                  for range in suspicious_ranges)


if __name__ == "__main__":
    # Read alert from stdin
    alert = sys.stdin.read()

    detector = BehavioralAnomalyDetector()
    anomalies = detector.process_alert(alert)

    # Output anomalies for Wazuh active response
    for anomaly in anomalies:
        print(json.dumps(anomaly))
```

## Use Case 1: User Behavior Analytics (UBA)

### Configuration

```xml
<!-- /var/ossec/etc/rules/uba_rules.xml -->
<group name="uba,anomaly">

  <!-- Detect privilege escalation attempts -->
  <rule id="100010" level="12">
    <if_sid>5303</if_sid>
    <match>sudo</match>
    <different_user />
    <description>User executing sudo commands for the first time</description>
    <mitre>
      <id>T1548</id>
    </mitre>
    <group>privilege_escalation,anomaly</group>
  </rule>

  <!-- Detect lateral movement -->
  <rule id="100011" level="10" frequency="5" timeframe="300">
    <if_sid>5706</if_sid>
    <different_fields>dst_ip</different_fields>
    <description>User accessing multiple systems in short time - possible lateral movement</description>
    <mitre>
      <id>T1021</id>
    </mitre>
    <group>lateral_movement,anomaly</group>
  </rule>

  <!-- Detect data staging -->
  <rule id="100012" level="11">
    <decoded_as>file_integrity</decoded_as>
    <field name="file_path">tmp|temp|staging</field>
    <field name="file_size" compare="greater">104857600</field> <!-- 100MB -->
    <description>Large file created in temporary directory - possible data staging</description>
    <mitre>
      <id>T1074</id>
    </mitre>
    <group>data_staging,anomaly</group>
  </rule>

</group>
```

### Implementation Script

```python
#!/usr/bin/env python3
# /var/ossec/integrations/uba_analyzer.py

import json
import sqlite3
from datetime import datetime, timedelta
from collections import Counter
import statistics

class UserBehaviorAnalyzer:
    def __init__(self, db_path='/var/ossec/logs/uba.db'):
        self.conn = sqlite3.connect(db_path)
        self.init_database()

    def init_database(self):
        """Initialize UBA database"""
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                user TEXT,
                action TEXT,
                resource TEXT,
                risk_score INTEGER,
                anomaly_type TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_profiles (
                user TEXT PRIMARY KEY,
                normal_hours TEXT,
                common_resources TEXT,
                risk_level INTEGER,
                last_updated DATETIME
            )
        ''')
        self.conn.commit()

    def analyze_user_behavior(self, user, action, resource, timestamp):
        """Analyze user behavior and calculate risk score"""
        risk_score = 0
        anomalies = []

        # Get user profile
        cursor = self.conn.cursor()
        cursor.execute(
            'SELECT * FROM user_profiles WHERE user = ?',
            (user,)
        )
        profile = cursor.fetchone()

        # Check time-based anomalies
        current_hour = datetime.fromisoformat(timestamp).hour
        if profile and profile[1]:  # normal_hours
            normal_hours = json.loads(profile[1])
            if current_hour not in normal_hours:
                risk_score += 30
                anomalies.append('after_hours_activity')

        # Check resource access anomalies
        if profile and profile[2]:  # common_resources
            common_resources = json.loads(profile[2])
            if resource not in common_resources:
                risk_score += 20
                anomalies.append('unusual_resource_access')

        # Check for suspicious actions
        suspicious_actions = {
            'password_change': 25,
            'user_creation': 30,
            'permission_change': 35,
            'data_download': 20,
            'config_modification': 40
        }

        for suspicious, score in suspicious_actions.items():
            if suspicious in action.lower():
                risk_score += score
                anomalies.append(f'suspicious_action_{suspicious}')

        # Check frequency anomalies
        frequency_risk = self.check_frequency_anomaly(user, action)
        risk_score += frequency_risk

        # Store activity
        cursor.execute('''
            INSERT INTO user_activities
            (timestamp, user, action, resource, risk_score, anomaly_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, user, action, resource,
            risk_score, ','.join(anomalies)
        ))
        self.conn.commit()

        # Update user profile
        self.update_user_profile(user, timestamp, current_hour, resource)

        return {
            'user': user,
            'risk_score': risk_score,
            'anomalies': anomalies,
            'action': action,
            'resource': resource,
            'timestamp': timestamp,
            'severity': self.calculate_severity(risk_score)
        }

    def check_frequency_anomaly(self, user, action):
        """Check for frequency-based anomalies"""
        cursor = self.conn.cursor()

        # Get recent activities
        one_hour_ago = datetime.now() - timedelta(hours=1)
        cursor.execute('''
            SELECT COUNT(*) FROM user_activities
            WHERE user = ? AND action = ? AND timestamp > ?
        ''', (user, action, one_hour_ago.isoformat()))

        recent_count = cursor.fetchone()[0]

        # Get historical average
        cursor.execute('''
            SELECT COUNT(*) FROM user_activities
            WHERE user = ? AND action = ?
            GROUP BY DATE(timestamp)
        ''', (user, action))

        daily_counts = [row[0] for row in cursor.fetchall()]

        if daily_counts:
            avg_hourly = statistics.mean(daily_counts) / 24
            if recent_count > avg_hourly * 3:  # 3x normal rate
                return 40  # High risk

        return 0

    def update_user_profile(self, user, timestamp, hour, resource):
        """Update user behavior profile"""
        cursor = self.conn.cursor()

        # Get existing profile
        cursor.execute(
            'SELECT normal_hours, common_resources FROM user_profiles WHERE user = ?',
            (user,)
        )
        result = cursor.fetchone()

        if result:
            normal_hours = set(json.loads(result[0]))
            common_resources = set(json.loads(result[1]))
        else:
            normal_hours = set()
            common_resources = set()

        # Update with new data
        normal_hours.add(hour)
        common_resources.add(resource)

        # Calculate risk level based on history
        cursor.execute('''
            SELECT AVG(risk_score) FROM user_activities
            WHERE user = ? AND timestamp > ?
        ''', (user, (datetime.now() - timedelta(days=7)).isoformat()))

        avg_risk = cursor.fetchone()[0] or 0
        risk_level = int(avg_risk / 20)  # 0-5 scale

        # Update profile
        cursor.execute('''
            INSERT OR REPLACE INTO user_profiles
            (user, normal_hours, common_resources, risk_level, last_updated)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            user,
            json.dumps(list(normal_hours)),
            json.dumps(list(common_resources)),
            risk_level,
            timestamp
        ))
        self.conn.commit()

    def calculate_severity(self, risk_score):
        """Calculate severity level from risk score"""
        if risk_score >= 80:
            return 'critical'
        elif risk_score >= 60:
            return 'high'
        elif risk_score >= 40:
            return 'medium'
        elif risk_score >= 20:
            return 'low'
        else:
            return 'info'
```

## Use Case 2: Network Traffic Anomaly Detection

### DGA (Domain Generation Algorithm) Detection

```python
#!/usr/bin/env python3
# /var/ossec/integrations/dga_detector.py

import json
import math
import re
from collections import Counter

class DGADetector:
    def __init__(self):
        self.tld_list = [
            'com', 'net', 'org', 'info', 'biz', 'co.uk',
            'de', 'fr', 'ru', 'cn', 'jp', 'in'
        ]
        self.english_freq = {
            'a': 0.0817, 'b': 0.0149, 'c': 0.0278, 'd': 0.0425,
            'e': 0.1270, 'f': 0.0223, 'g': 0.0202, 'h': 0.0609,
            'i': 0.0697, 'j': 0.0015, 'k': 0.0077, 'l': 0.0403,
            'm': 0.0241, 'n': 0.0675, 'o': 0.0751, 'p': 0.0193,
            'q': 0.0010, 'r': 0.0599, 's': 0.0633, 't': 0.0906,
            'u': 0.0276, 'v': 0.0098, 'w': 0.0236, 'x': 0.0015,
            'y': 0.0197, 'z': 0.0007
        }

    def analyze_domain(self, domain):
        """Analyze domain for DGA characteristics"""
        # Remove TLD
        domain_parts = domain.split('.')
        if len(domain_parts) < 2:
            return None

        sld = domain_parts[-2]  # Second level domain

        features = {
            'domain': domain,
            'length': len(sld),
            'entropy': self.calculate_entropy(sld),
            'consonant_ratio': self.calculate_consonant_ratio(sld),
            'number_ratio': self.calculate_number_ratio(sld),
            'bigram_score': self.calculate_bigram_score(sld),
            'lexical_diversity': self.calculate_lexical_diversity(sld),
            'suspicious_tld': self.check_suspicious_tld(domain_parts[-1])
        }

        # Calculate DGA probability
        dga_score = self.calculate_dga_score(features)
        features['dga_score'] = dga_score
        features['is_dga'] = dga_score > 0.7

        return features

    def calculate_entropy(self, text):
        """Calculate Shannon entropy"""
        if not text:
            return 0

        prob = [float(text.count(c)) / len(text) for c in dict.fromkeys(text)]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob if p > 0])
        return entropy

    def calculate_consonant_ratio(self, text):
        """Calculate ratio of consonants to total characters"""
        vowels = 'aeiouAEIOU'
        consonants = sum(1 for c in text if c.isalpha() and c not in vowels)
        return consonants / len(text) if text else 0

    def calculate_number_ratio(self, text):
        """Calculate ratio of numbers to total characters"""
        numbers = sum(1 for c in text if c.isdigit())
        return numbers / len(text) if text else 0

    def calculate_bigram_score(self, text):
        """Calculate bigram frequency score"""
        if len(text) < 2:
            return 0

        bigrams = [text[i:i+2] for i in range(len(text)-1)]

        # Common English bigrams
        common_bigrams = [
            'th', 'he', 'in', 'en', 'nt', 're', 'er', 'an',
            'ti', 'es', 'on', 'at', 'se', 'nd', 'or', 'ar'
        ]

        score = sum(1 for bg in bigrams if bg.lower() in common_bigrams)
        return score / len(bigrams)

    def calculate_lexical_diversity(self, text):
        """Calculate character diversity"""
        if not text:
            return 0
        return len(set(text)) / len(text)

    def check_suspicious_tld(self, tld):
        """Check if TLD is commonly used in DGA"""
        suspicious_tlds = ['tk', 'ml', 'ga', 'cf', 'click', 'download']
        return tld.lower() in suspicious_tlds

    def calculate_dga_score(self, features):
        """Calculate overall DGA probability score"""
        score = 0

        # High entropy indicates randomness
        if features['entropy'] > 3.5:
            score += 0.3
        elif features['entropy'] > 3.0:
            score += 0.2

        # High consonant ratio
        if features['consonant_ratio'] > 0.65:
            score += 0.2

        # Contains numbers
        if features['number_ratio'] > 0.1:
            score += 0.15

        # Low bigram score (uncommon letter combinations)
        if features['bigram_score'] < 0.1:
            score += 0.2

        # High lexical diversity
        if features['lexical_diversity'] > 0.8:
            score += 0.1

        # Suspicious TLD
        if features['suspicious_tld']:
            score += 0.15

        # Long domain name
        if features['length'] > 20:
            score += 0.1
        elif features['length'] > 15:
            score += 0.05

        return min(score, 1.0)  # Cap at 1.0


def main():
    # Read DNS query log from Wazuh
    alert = json.loads(sys.stdin.read())

    if 'data' in alert and 'dns' in alert['data']:
        domain = alert['data']['dns'].get('query', '')

        detector = DGADetector()
        result = detector.analyze_domain(domain)

        if result and result['is_dga']:
            # Generate Wazuh alert
            anomaly_alert = {
                'integration': 'dga_detector',
                'anomaly_type': 'suspicious_domain',
                'severity': 'high',
                'domain': domain,
                'dga_score': result['dga_score'],
                'features': result,
                'description': f'Possible DGA domain detected: {domain}',
                'mitre_attack': ['T1568.002']  # Dynamic Resolution: DGA
            }

            print(json.dumps(anomaly_alert))

if __name__ == '__main__':
    main()
```

## Use Case 3: Application Behavior Anomaly Detection

### Web Application Anomaly Detection

```xml
<!-- /var/ossec/etc/rules/webapp_anomaly.xml -->
<group name="web,anomaly,webapp">

  <!-- Unusual request size -->
  <rule id="100020" level="7">
    <if_sid>31100</if_sid>
    <field name="http.request.length" compare="greater">10000</field>
    <description>Unusually large HTTP request detected</description>
    <group>web_anomaly</group>
  </rule>

  <!-- Unusual user agent -->
  <rule id="100021" level="8">
    <if_sid>31100</if_sid>
    <field name="http.user_agent">python|curl|wget|nikto|sqlmap</field>
    <description>Suspicious user agent detected - possible automated tool</description>
    <group>web_anomaly,recon</group>
  </rule>

  <!-- Parameter pollution -->
  <rule id="100022" level="9">
    <if_sid>31100</if_sid>
    <regex>\?.*([^&=]+=[^&]*&)\1{2,}</regex>
    <description>HTTP parameter pollution attempt detected</description>
    <group>web_anomaly,attack</group>
  </rule>

  <!-- Unusual response time -->
  <rule id="100023" level="6">
    <if_sid>31100</if_sid>
    <field name="http.response_time" compare="greater">5000</field>
    <description>Slow HTTP response - possible DoS or resource exhaustion</description>
    <group>web_anomaly,performance</group>
  </rule>

</group>
```

### API Behavior Monitoring

```python
#!/usr/bin/env python3
# /var/ossec/integrations/api_anomaly_detector.py

import json
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
import numpy as np

class APIAnomalyDetector:
    def __init__(self):
        self.endpoint_stats = defaultdict(lambda: {
            'response_times': deque(maxlen=1000),
            'status_codes': defaultdict(int),
            'request_rates': deque(maxlen=60),  # Per minute for last hour
            'unique_ips': set(),
            'payload_sizes': deque(maxlen=1000),
            'error_rate': deque(maxlen=100)
        })

        self.user_patterns = defaultdict(lambda: {
            'endpoints': defaultdict(int),
            'request_times': deque(maxlen=1000),
            'auth_failures': 0,
            'data_volume': 0
        })

    def analyze_api_request(self, log_data):
        """Analyze API request for anomalies"""
        anomalies = []

        # Extract fields
        endpoint = log_data.get('endpoint', '')
        method = log_data.get('method', '')
        status = int(log_data.get('status', 0))
        response_time = int(log_data.get('response_time', 0))
        user = log_data.get('user', 'anonymous')
        ip = log_data.get('source_ip', '')
        payload_size = int(log_data.get('payload_size', 0))
        timestamp = log_data.get('timestamp', datetime.now().isoformat())

        # Update statistics
        stats = self.endpoint_stats[endpoint]
        stats['response_times'].append(response_time)
        stats['status_codes'][status] += 1
        stats['unique_ips'].add(ip)
        stats['payload_sizes'].append(payload_size)

        # Check response time anomaly
        if len(stats['response_times']) > 100:
            mean_rt = np.mean(stats['response_times'])
            std_rt = np.std(stats['response_times'])

            if response_time > mean_rt + (3 * std_rt):
                anomalies.append({
                    'type': 'slow_response',
                    'severity': 'medium',
                    'details': f'Response time {response_time}ms exceeds normal range',
                    'baseline_mean': mean_rt,
                    'baseline_std': std_rt
                })

        # Check error rate anomaly
        if status >= 400:
            stats['error_rate'].append(1)
        else:
            stats['error_rate'].append(0)

        if len(stats['error_rate']) == 100:
            error_rate = sum(stats['error_rate']) / 100
            if error_rate > 0.1:  # >10% error rate
                anomalies.append({
                    'type': 'high_error_rate',
                    'severity': 'high',
                    'details': f'Error rate {error_rate:.2%} exceeds threshold',
                    'endpoint': endpoint
                })

        # Check request pattern anomalies
        user_anomalies = self.check_user_pattern_anomalies(user, endpoint, timestamp)
        anomalies.extend(user_anomalies)

        # Check payload size anomaly
        if payload_size > 0 and len(stats['payload_sizes']) > 50:
            mean_size = np.mean(stats['payload_sizes'])
            std_size = np.std(stats['payload_sizes'])

            if payload_size > mean_size + (3 * std_size):
                anomalies.append({
                    'type': 'large_payload',
                    'severity': 'medium',
                    'details': f'Payload size {payload_size} bytes exceeds normal',
                    'baseline_mean': mean_size
                })

        # Check for API abuse patterns
        abuse_patterns = self.check_api_abuse_patterns(endpoint, method, user, ip)
        anomalies.extend(abuse_patterns)

        return anomalies

    def check_user_pattern_anomalies(self, user, endpoint, timestamp):
        """Check for anomalies in user behavior patterns"""
        anomalies = []
        user_data = self.user_patterns[user]

        # Update user data
        user_data['endpoints'][endpoint] += 1
        user_data['request_times'].append(timestamp)

        # Check for endpoint scanning
        if len(user_data['endpoints']) > 50:
            anomalies.append({
                'type': 'endpoint_scanning',
                'severity': 'high',
                'details': f'User {user} accessed {len(user_data["endpoints"])} different endpoints',
                'user': user
            })

        # Check request frequency
        if len(user_data['request_times']) > 10:
            recent_requests = [
                t for t in user_data['request_times']
                if datetime.fromisoformat(t) > datetime.now() - timedelta(minutes=1)
            ]

            if len(recent_requests) > 100:  # >100 requests per minute
                anomalies.append({
                    'type': 'high_request_rate',
                    'severity': 'high',
                    'details': f'User {user} made {len(recent_requests)} requests in last minute',
                    'user': user
                })

        return anomalies

    def check_api_abuse_patterns(self, endpoint, method, user, ip):
        """Check for API abuse patterns"""
        anomalies = []

        # Check for dangerous endpoints
        dangerous_patterns = [
            '/admin/', '/config/', '/debug/', '/internal/',
            '/api/v1/users/delete', '/api/v1/data/export'
        ]

        for pattern in dangerous_patterns:
            if pattern in endpoint:
                anomalies.append({
                    'type': 'dangerous_endpoint_access',
                    'severity': 'critical',
                    'details': f'Access to dangerous endpoint: {endpoint}',
                    'user': user,
                    'endpoint': endpoint
                })
                break

        # Check for method anomalies
        if method in ['DELETE', 'PUT'] and '/api/v1/' in endpoint:
            # Check if user typically uses these methods
            user_methods = self.user_patterns[user].get('methods', defaultdict(int))
            if user_methods[method] < 5:  # Rarely uses these methods
                anomalies.append({
                    'type': 'unusual_method',
                    'severity': 'medium',
                    'details': f'Unusual {method} request from user {user}',
                    'user': user,
                    'method': method
                })

        return anomalies
```

## Use Case 4: Insider Threat Detection

### Configuration for Insider Threat Monitoring

```xml
<!-- /var/ossec/etc/rules/insider_threat.xml -->
<group name="insider_threat,anomaly">

  <!-- After hours data access -->
  <rule id="100030" level="8">
    <if_sid>550,551,552</if_sid>
    <time>weekdays: 20:00-06:00</time>
    <field name="file.path">confidential|sensitive|secret</field>
    <description>Sensitive file accessed after business hours</description>
    <group>insider_threat,data_theft</group>
  </rule>

  <!-- Mass file download -->
  <rule id="100031" level="10" frequency="50" timeframe="300">
    <if_sid>550</if_sid>
    <same_user />
    <description>Mass file download detected - possible data exfiltration</description>
    <mitre>
      <id>T1567</id>
    </mitre>
    <group>insider_threat,exfiltration</group>
  </rule>

  <!-- USB device usage anomaly -->
  <rule id="100032" level="9">
    <decoded_as>usb_monitor</decoded_as>
    <field name="action">mount</field>
    <field name="device_type">storage</field>
    <time>weekdays: 18:00-08:00</time>
    <description>USB storage device connected after hours</description>
    <group>insider_threat,removable_media</group>
  </rule>

  <!-- Email to personal account -->
  <rule id="100033" level="9">
    <if_sid>3600</if_sid>
    <field name="mail.to">gmail.com|yahoo.com|hotmail.com|outlook.com</field>
    <field name="mail.attachments" compare="greater">0</field>
    <description>Email with attachments sent to personal account</description>
    <group>insider_threat,data_leak</group>
  </rule>

</group>
```

### Insider Threat Scoring System

```python
#!/usr/bin/env python3
# /var/ossec/integrations/insider_threat_scorer.py

import json
import sqlite3
from datetime import datetime, timedelta
from collections import defaultdict
import networkx as nx

class InsiderThreatScorer:
    def __init__(self, db_path='/var/ossec/logs/insider_threat.db'):
        self.conn = sqlite3.connect(db_path)
        self.init_database()
        self.risk_weights = {
            'after_hours_access': 15,
            'sensitive_file_access': 20,
            'mass_download': 30,
            'unusual_application': 10,
            'privilege_escalation': 35,
            'data_staging': 25,
            'external_transfer': 40,
            'policy_violation': 20,
            'anomalous_behavior': 15
        }

    def init_database(self):
        """Initialize threat scoring database"""
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS threat_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                user TEXT,
                indicator TEXT,
                score INTEGER,
                details TEXT,
                cumulative_score INTEGER
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_risk_profiles (
                user TEXT PRIMARY KEY,
                current_score INTEGER,
                peak_score INTEGER,
                indicators_count INTEGER,
                first_seen DATETIME,
                last_updated DATETIME,
                risk_level TEXT
            )
        ''')
        self.conn.commit()

    def process_event(self, event):
        """Process security event and update threat score"""
        user = event.get('user', 'unknown')
        timestamp = event.get('timestamp', datetime.now().isoformat())
        indicators = self.extract_indicators(event)

        total_score = 0
        threat_details = []

        for indicator in indicators:
            score = self.risk_weights.get(indicator['type'], 10)

            # Apply contextual multipliers
            score = self.apply_context_multipliers(score, indicator, event)

            total_score += score
            threat_details.append({
                'indicator': indicator['type'],
                'score': score,
                'details': indicator.get('details', '')
            })

            # Store indicator
            self.store_indicator(user, timestamp, indicator['type'], score, indicator.get('details', ''))

        # Update user risk profile
        self.update_risk_profile(user, total_score, timestamp)

        # Check if threshold exceeded
        risk_assessment = self.assess_risk(user)

        return {
            'user': user,
            'event_score': total_score,
            'cumulative_score': risk_assessment['cumulative_score'],
            'risk_level': risk_assessment['risk_level'],
            'indicators': threat_details,
            'recommended_action': risk_assessment['recommended_action']
        }

    def extract_indicators(self, event):
        """Extract threat indicators from event"""
        indicators = []

        # Check time-based anomalies
        event_time = datetime.fromisoformat(event['timestamp'])
        if event_time.hour < 6 or event_time.hour > 20:
            if 'file' in event and 'sensitive' in event.get('file', {}).get('path', '').lower():
                indicators.append({
                    'type': 'after_hours_access',
                    'details': f'Accessed sensitive file at {event_time.hour}:00'
                })

        # Check for mass operations
        if event.get('operation_count', 0) > 50:
            indicators.append({
                'type': 'mass_download',
                'details': f'{event["operation_count"]} files accessed'
            })

        # Check for data staging
        if 'file' in event:
            path = event['file'].get('path', '')
            if any(staging in path.lower() for staging in ['temp', 'tmp', 'staging', 'export']):
                if event['file'].get('size', 0) > 100_000_000:  # 100MB
                    indicators.append({
                        'type': 'data_staging',
                        'details': f'Large file in staging area: {path}'
                    })

        # Check for external transfer
        if 'network' in event:
            dest_ip = event['network'].get('dest_ip', '')
            if not self.is_internal_ip(dest_ip):
                if event['network'].get('bytes_out', 0) > 50_000_000:  # 50MB
                    indicators.append({
                        'type': 'external_transfer',
                        'details': f'Large external transfer to {dest_ip}'
                    })

        # Check for privilege escalation
        if event.get('action') == 'privilege_escalation':
            indicators.append({
                'type': 'privilege_escalation',
                'details': event.get('details', '')
            })

        return indicators

    def apply_context_multipliers(self, base_score, indicator, event):
        """Apply contextual multipliers to risk score"""
        multiplier = 1.0

        # User role multiplier
        user_role = event.get('user_role', '')
        if user_role in ['admin', 'root', 'administrator']:
            multiplier *= 1.5
        elif user_role in ['developer', 'engineer']:
            multiplier *= 1.3

        # Repeat behavior multiplier
        if self.is_repeat_behavior(event['user'], indicator['type']):
            multiplier *= 0.7  # Lower score for consistent behavior
        else:
            multiplier *= 1.5  # Higher score for new behavior

        # Time-based multiplier
        if indicator['type'] in ['after_hours_access', 'external_transfer']:
            event_time = datetime.fromisoformat(event['timestamp'])
            if event_time.weekday() >= 5:  # Weekend
                multiplier *= 1.5

        return int(base_score * multiplier)

    def is_repeat_behavior(self, user, indicator_type):
        """Check if this is repeat behavior for the user"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) FROM threat_scores
            WHERE user = ? AND indicator = ?
            AND timestamp > ?
        ''', (user, indicator_type, (datetime.now() - timedelta(days=30)).isoformat()))

        count = cursor.fetchone()[0]
        return count > 5

    def update_risk_profile(self, user, new_score, timestamp):
        """Update user's risk profile"""
        cursor = self.conn.cursor()

        # Get current profile
        cursor.execute(
            'SELECT current_score, peak_score, indicators_count FROM user_risk_profiles WHERE user = ?',
            (user,)
        )
        result = cursor.fetchone()

        if result:
            current_score = result[0] + new_score
            peak_score = max(result[1], current_score)
            indicators_count = result[2] + 1
        else:
            current_score = new_score
            peak_score = new_score
            indicators_count = 1

        # Calculate risk level
        if current_score >= 100:
            risk_level = 'critical'
        elif current_score >= 75:
            risk_level = 'high'
        elif current_score >= 50:
            risk_level = 'medium'
        elif current_score >= 25:
            risk_level = 'low'
        else:
            risk_level = 'minimal'

        # Update profile
        cursor.execute('''
            INSERT OR REPLACE INTO user_risk_profiles
            (user, current_score, peak_score, indicators_count, first_seen, last_updated, risk_level)
            VALUES (?, ?, ?, ?, COALESCE((SELECT first_seen FROM user_risk_profiles WHERE user = ?), ?), ?, ?)
        ''', (user, current_score, peak_score, indicators_count, user, timestamp, timestamp, risk_level))

        self.conn.commit()

    def assess_risk(self, user):
        """Assess user's current risk level"""
        cursor = self.conn.cursor()
        cursor.execute(
            'SELECT current_score, risk_level, indicators_count FROM user_risk_profiles WHERE user = ?',
            (user,)
        )
        result = cursor.fetchone()

        if not result:
            return {
                'cumulative_score': 0,
                'risk_level': 'minimal',
                'recommended_action': 'continue_monitoring'
            }

        cumulative_score, risk_level, indicators_count = result

        # Determine recommended action
        if risk_level == 'critical':
            action = 'immediate_investigation'
        elif risk_level == 'high':
            action = 'priority_review'
        elif risk_level == 'medium':
            action = 'enhanced_monitoring'
        else:
            action = 'continue_monitoring'

        # Check for rapid score increase
        cursor.execute('''
            SELECT SUM(score) FROM threat_scores
            WHERE user = ? AND timestamp > ?
        ''', (user, (datetime.now() - timedelta(hours=1)).isoformat()))

        recent_score = cursor.fetchone()[0] or 0
        if recent_score > 50:
            action = 'immediate_investigation'

        return {
            'cumulative_score': cumulative_score,
            'risk_level': risk_level,
            'indicators_count': indicators_count,
            'recommended_action': action,
            'recent_activity_score': recent_score
        }

    def is_internal_ip(self, ip):
        """Check if IP is internal"""
        internal_ranges = ['10.', '172.16.', '172.17.', '172.18.', '172.19.',
                          '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                          '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                          '172.30.', '172.31.', '192.168.']
        return any(ip.startswith(range) for range in internal_ranges)

    def store_indicator(self, user, timestamp, indicator_type, score, details):
        """Store threat indicator in database"""
        cursor = self.conn.cursor()

        # Get cumulative score
        cursor.execute(
            'SELECT current_score FROM user_risk_profiles WHERE user = ?',
            (user,)
        )
        result = cursor.fetchone()
        cumulative = result[0] if result else score

        cursor.execute('''
            INSERT INTO threat_scores
            (timestamp, user, indicator, score, details, cumulative_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (timestamp, user, indicator_type, score, details, cumulative))

        self.conn.commit()
```

## Use Case 5: Machine Learning Integration

### Anomaly Detection with Isolation Forest

```python
#!/usr/bin/env python3
# /var/ossec/integrations/ml_anomaly_detector.py

import json
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from datetime import datetime, timedelta

class MLAnomalyDetector:
    def __init__(self, model_path='/var/ossec/models/'):
        self.model_path = model_path
        self.models = {}
        self.scalers = {}
        self.feature_extractors = {
            'network': self.extract_network_features,
            'authentication': self.extract_auth_features,
            'file_access': self.extract_file_features,
            'process': self.extract_process_features
        }
        self.load_models()

    def load_models(self):
        """Load pre-trained models"""
        for model_type in ['network', 'authentication', 'file_access', 'process']:
            try:
                self.models[model_type] = joblib.load(f'{self.model_path}/{model_type}_model.pkl')
                self.scalers[model_type] = joblib.load(f'{self.model_path}/{model_type}_scaler.pkl')
            except:
                # Initialize new model if not found
                self.models[model_type] = IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=100
                )
                self.scalers[model_type] = StandardScaler()

    def extract_network_features(self, event):
        """Extract features for network anomaly detection"""
        features = {
            'src_port': int(event.get('src_port', 0)),
            'dst_port': int(event.get('dst_port', 0)),
            'packet_size': int(event.get('packet_size', 0)),
            'duration': int(event.get('duration', 0)),
            'bytes_in': int(event.get('bytes_in', 0)),
            'bytes_out': int(event.get('bytes_out', 0)),
            'packets_in': int(event.get('packets_in', 0)),
            'packets_out': int(event.get('packets_out', 0)),
            'protocol_tcp': 1 if event.get('protocol') == 'tcp' else 0,
            'protocol_udp': 1 if event.get('protocol') == 'udp' else 0,
            'hour': datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).hour,
            'is_weekend': 1 if datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).weekday() >= 5 else 0
        }
        return features

    def extract_auth_features(self, event):
        """Extract features for authentication anomaly detection"""
        features = {
            'hour': datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).hour,
            'day_of_week': datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).weekday(),
            'is_weekend': 1 if datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).weekday() >= 5 else 0,
            'auth_success': 1 if event.get('outcome') == 'success' else 0,
            'source_ip_octets': self.ip_to_features(event.get('source_ip', '0.0.0.0')),
            'auth_type_password': 1 if event.get('auth_type') == 'password' else 0,
            'auth_type_key': 1 if event.get('auth_type') == 'publickey' else 0,
            'auth_type_kerberos': 1 if event.get('auth_type') == 'kerberos' else 0
        }

        # Flatten IP octets
        ip_features = features.pop('source_ip_octets')
        for i, octet in enumerate(ip_features):
            features[f'ip_octet_{i}'] = octet

        return features

    def extract_file_features(self, event):
        """Extract features for file access anomaly detection"""
        file_path = event.get('file_path', '')
        features = {
            'hour': datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).hour,
            'file_size': int(event.get('file_size', 0)),
            'operation_read': 1 if event.get('operation') == 'read' else 0,
            'operation_write': 1 if event.get('operation') == 'write' else 0,
            'operation_delete': 1 if event.get('operation') == 'delete' else 0,
            'is_hidden': 1 if file_path.startswith('.') or '/.' in file_path else 0,
            'is_system': 1 if any(sys_path in file_path for sys_path in ['/etc/', '/sys/', '/proc/']) else 0,
            'path_depth': file_path.count('/'),
            'extension_executable': 1 if any(file_path.endswith(ext) for ext in ['.exe', '.sh', '.bat', '.cmd']) else 0,
            'extension_config': 1 if any(file_path.endswith(ext) for ext in ['.conf', '.cfg', '.ini', '.yaml']) else 0
        }
        return features

    def extract_process_features(self, event):
        """Extract features for process anomaly detection"""
        features = {
            'hour': datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat())).hour,
            'cpu_usage': float(event.get('cpu_usage', 0)),
            'memory_usage': float(event.get('memory_usage', 0)),
            'thread_count': int(event.get('thread_count', 1)),
            'ppid': int(event.get('ppid', 0)),
            'nice_value': int(event.get('nice', 0)),
            'is_system_process': 1 if int(event.get('uid', 1000)) < 1000 else 0,
            'has_network': 1 if event.get('network_connections', 0) > 0 else 0,
            'child_count': int(event.get('child_processes', 0)),
            'file_descriptors': int(event.get('open_files', 0))
        }
        return features

    def ip_to_features(self, ip):
        """Convert IP address to numerical features"""
        try:
            octets = [int(x) for x in ip.split('.')]
            return octets + [0] * (4 - len(octets))
        except:
            return [0, 0, 0, 0]

    def detect_anomaly(self, event_type, event_data):
        """Detect anomaly using appropriate model"""
        if event_type not in self.models:
            return None

        # Extract features
        feature_extractor = self.feature_extractors.get(event_type)
        if not feature_extractor:
            return None

        features = feature_extractor(event_data)

        # Convert to array
        feature_array = np.array(list(features.values())).reshape(1, -1)

        # Scale features
        try:
            scaled_features = self.scalers[event_type].transform(feature_array)
        except:
            # Fit scaler if not fitted
            scaled_features = self.scalers[event_type].fit_transform(feature_array)

        # Predict
        prediction = self.models[event_type].predict(scaled_features)[0]
        anomaly_score = self.models[event_type].score_samples(scaled_features)[0]

        if prediction == -1:  # Anomaly detected
            return {
                'is_anomaly': True,
                'anomaly_score': float(-anomaly_score),  # Convert to positive score
                'event_type': event_type,
                'features': features,
                'severity': self.calculate_severity(anomaly_score),
                'confidence': self.calculate_confidence(anomaly_score)
            }

        return {
            'is_anomaly': False,
            'anomaly_score': float(-anomaly_score),
            'event_type': event_type
        }

    def calculate_severity(self, anomaly_score):
        """Calculate severity based on anomaly score"""
        if anomaly_score < -0.5:
            return 'critical'
        elif anomaly_score < -0.3:
            return 'high'
        elif anomaly_score < -0.1:
            return 'medium'
        else:
            return 'low'

    def calculate_confidence(self, anomaly_score):
        """Calculate confidence level"""
        # Map anomaly score to confidence percentage
        confidence = min(100, max(0, (abs(anomaly_score) + 0.5) * 100))
        return round(confidence, 2)

    def update_model(self, event_type, new_data, labels=None):
        """Update model with new data (online learning)"""
        if event_type not in self.models:
            return

        # Extract features for all new data
        feature_extractor = self.feature_extractors.get(event_type)
        features_list = []

        for event in new_data:
            features = feature_extractor(event)
            features_list.append(list(features.values()))

        # Convert to array
        X = np.array(features_list)

        # Update scaler
        self.scalers[event_type].partial_fit(X)

        # Scale features
        X_scaled = self.scalers[event_type].transform(X)

        # Retrain model (in practice, you might want to use incremental learning)
        if labels is None:
            # Unsupervised retraining
            self.models[event_type].fit(X_scaled)
        else:
            # Semi-supervised if labels are provided
            # IsolationForest doesn't support this directly,
            # but you could use this for model selection
            pass

        # Save updated model
        joblib.dump(self.models[event_type], f'{self.model_path}/{event_type}_model.pkl')
        joblib.dump(self.scalers[event_type], f'{self.model_path}/{event_type}_scaler.pkl')


def main():
    # Read event from Wazuh
    event = json.loads(sys.stdin.read())

    # Determine event type
    rule_id = event.get('rule', {}).get('id', '')

    if rule_id.startswith('5'):
        event_type = 'authentication'
    elif rule_id.startswith('6'):
        event_type = 'network'
    elif rule_id.startswith('7'):
        event_type = 'file_access'
    elif rule_id.startswith('8'):
        event_type = 'process'
    else:
        event_type = None

    if event_type:
        detector = MLAnomalyDetector()
        result = detector.detect_anomaly(event_type, event.get('data', {}))

        if result and result['is_anomaly']:
            # Generate alert
            anomaly_alert = {
                'integration': 'ml_anomaly_detector',
                'anomaly': result,
                'original_event': event,
                'timestamp': datetime.now().isoformat(),
                'description': f'ML-detected anomaly in {event_type} behavior'
            }

            print(json.dumps(anomaly_alert))

if __name__ == '__main__':
    main()
```

## Integration and Deployment

### Wazuh Manager Configuration

```xml
<!-- /var/ossec/etc/ossec.conf -->
<ossec_config>
  <!-- Enable anomaly detection integrations -->
  <integration>
    <name>behavioral_anomaly</name>
    <hook_url>file:///var/ossec/integrations/behavioral_anomaly.py</hook_url>
    <rule_id>5501,5503,5901,550,551,552,86001-86010</rule_id>
    <alert_format>json</alert_format>
    <options>{"threshold": 2.5, "window_days": 7}</options>
  </integration>

  <integration>
    <name>dga_detector</name>
    <hook_url>file:///var/ossec/integrations/dga_detector.py</hook_url>
    <rule_id>34001-34100</rule_id>
    <alert_format>json</alert_format>
  </integration>

  <integration>
    <name>ml_anomaly_detector</name>
    <hook_url>file:///var/ossec/integrations/ml_anomaly_detector.py</hook_url>
    <rule_id>all</rule_id>
    <alert_format>json</alert_format>
    <options>{"model_path": "/var/ossec/models/"}</options>
  </integration>

  <!-- Active response for anomalies -->
  <active-response>
    <disabled>no</disabled>
    <command>anomaly-response</command>
    <location>local</location>
    <rules_id>100001-100100</rules_id>
    <timeout>300</timeout>
  </active-response>
</ossec_config>
```

### Active Response Script

```bash
#!/bin/bash
# /var/ossec/active-response/bin/anomaly-response.sh

ACTION=$1
USER=$2
IP=$3
ALERT_ID=$4
RULE_ID=$5

LOG_FILE="/var/ossec/logs/active-responses.log"

DATE=$(date +"%Y-%m-%d %H:%M:%S")
echo "[$DATE] Anomaly response triggered: Action=$ACTION User=$USER IP=$IP Alert=$ALERT_ID Rule=$RULE_ID" >> $LOG_FILE

case $RULE_ID in
    # High-risk anomalies - immediate action
    10003[0-9]|10004[0-9])
        if [ "$ACTION" = "add" ]; then
            # Block user account
            usermod -L "$USER" 2>/dev/null
            echo "[$DATE] User $USER account locked due to high-risk anomaly" >> $LOG_FILE

            # Kill user sessions
            pkill -KILL -u "$USER"

            # Send alert to security team
            /var/ossec/integrations/send_alert.py "Critical anomaly detected for user $USER"
        fi
        ;;

    # Medium-risk anomalies - enhanced monitoring
    10002[0-9])
        if [ "$ACTION" = "add" ]; then
            # Enable detailed logging for user
            echo "$USER" >> /var/ossec/logs/enhanced_monitoring.list

            # Increase audit logging
            auditctl -a always,exit -F arch=b64 -F uid="$USER" -S all -k anomaly_monitor
        fi
        ;;

    # Network anomalies - firewall rules
    10001[0-9])
        if [ "$ACTION" = "add" ] && [ "$IP" != "" ]; then
            # Add temporary firewall rule
            iptables -I INPUT -s "$IP" -j DROP
            echo "[$DATE] Blocked IP $IP due to network anomaly" >> $LOG_FILE

            # Schedule removal after timeout
            echo "iptables -D INPUT -s $IP -j DROP" | at now + 5 hours
        fi
        ;;
esac

exit 0
```

## Monitoring and Tuning

### Performance Monitoring

```python
#!/usr/bin/env python3
# /var/ossec/scripts/anomaly_performance_monitor.py

import json
import sqlite3
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

class AnomalyPerformanceMonitor:
    def __init__(self):
        self.conn = sqlite3.connect('/var/ossec/logs/anomaly_metrics.db')
        self.init_database()

    def init_database(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS anomaly_metrics (
                timestamp DATETIME,
                detector_type TEXT,
                true_positives INTEGER,
                false_positives INTEGER,
                false_negatives INTEGER,
                processing_time REAL,
                memory_usage INTEGER
            )
        ''')
        self.conn.commit()

    def generate_performance_report(self):
        """Generate performance metrics report"""
        # Query metrics
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT
                detector_type,
                SUM(true_positives) as tp,
                SUM(false_positives) as fp,
                SUM(false_negatives) as fn,
                AVG(processing_time) as avg_time,
                MAX(memory_usage) as max_memory
            FROM anomaly_metrics
            WHERE timestamp > ?
            GROUP BY detector_type
        ''', ((datetime.now() - timedelta(days=7)).isoformat(),))

        results = cursor.fetchall()

        report = {
            'generated_at': datetime.now().isoformat(),
            'period': 'last_7_days',
            'detectors': {}
        }

        for row in results:
            detector_type, tp, fp, fn, avg_time, max_memory = row

            # Calculate metrics
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

            report['detectors'][detector_type] = {
                'precision': round(precision, 3),
                'recall': round(recall, 3),
                'f1_score': round(f1_score, 3),
                'avg_processing_time_ms': round(avg_time, 2),
                'max_memory_mb': round(max_memory / 1024 / 1024, 2),
                'total_alerts': tp + fp
            }

        return report

    def plot_anomaly_trends(self):
        """Generate visualization of anomaly trends"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT
                DATE(timestamp) as date,
                detector_type,
                SUM(true_positives + false_positives) as total_anomalies
            FROM anomaly_metrics
            WHERE timestamp > ?
            GROUP BY DATE(timestamp), detector_type
            ORDER BY date
        ''', ((datetime.now() - timedelta(days=30)).isoformat(),))

        data = cursor.fetchall()

        # Create plot
        plt.figure(figsize=(12, 6))

        # Process data by detector type
        detectors = {}
        for date, detector, count in data:
            if detector not in detectors:
                detectors[detector] = {'dates': [], 'counts': []}
            detectors[detector]['dates'].append(date)
            detectors[detector]['counts'].append(count)

        # Plot lines for each detector
        for detector, values in detectors.items():
            plt.plot(values['dates'], values['counts'], label=detector, marker='o')

        plt.xlabel('Date')
        plt.ylabel('Anomaly Count')
        plt.title('Anomaly Detection Trends (Last 30 Days)')
        plt.legend()
        plt.xticks(rotation=45)
        plt.tight_layout()

        # Save plot
        plt.savefig('/var/ossec/reports/anomaly_trends.png')
        plt.close()
```

## Best Practices

### 1. Baseline Establishment

- Allow 2-4 weeks for initial baseline creation
- Regularly update baselines to adapt to legitimate changes
- Separate baselines for different user groups and time periods

### 2. False Positive Reduction

```python
# Whitelist management
class AnomalyWhitelist:
    def __init__(self):
        self.whitelist = {
            'users': ['backup_user', 'monitoring_user'],
            'processes': ['backup.sh', 'health_check.py'],
            'ips': ['10.0.0.10', '10.0.0.11'],  # Monitoring servers
            'patterns': [
                r'^/var/log/.*\.log$',  # Log file access
                r'^/tmp/systemd-.*'      # System temporary files
            ]
        }

    def is_whitelisted(self, event_type, value):
        return value in self.whitelist.get(event_type, [])
```

### 3. Tuning Recommendations

- Start with higher thresholds and gradually lower them
- Use feedback loops to improve detection accuracy
- Implement time-based and context-aware thresholds
- Regular review of anomaly patterns and adjustments

### 4. Integration Guidelines

- Test integrations in isolated environments first
- Implement gradual rollout with monitoring
- Maintain separate configurations for different environments
- Document all custom rules and modifications

## Conclusion

Wazuh's anomaly detection capabilities provide a powerful layer of security beyond traditional signature-based detection. By implementing these use cases:

- **Behavioral Analysis**: Detect deviations from normal user and system behavior
- **Statistical Anomalies**: Identify outliers in system metrics and patterns
- **Machine Learning**: Leverage AI for advanced threat detection
- **Insider Threats**: Monitor and score internal security risks
- **Zero-Day Protection**: Detect unknown threats through behavioral patterns

The key to successful anomaly detection is continuous tuning, regular baseline updates, and integration with existing security workflows. These implementations provide a foundation for building a comprehensive anomaly detection system tailored to your organization's specific needs.

## Additional Resources

- [Wazuh Documentation - Custom Rules](https://documentation.wazuh.com/current/user-manual/ruleset/custom.html)
- [Wazuh Integration Guide](https://documentation.wazuh.com/current/user-manual/manager/wazuh-integrations.html)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [Scikit-learn Anomaly Detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html)
