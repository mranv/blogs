---
author: Anubhav Gain
pubDatetime: 2025-01-10T17:30:00+05:30
modDatetime: 2025-01-10T17:30:00+05:30
title: QUIC and HTTP/3 Security - Comprehensive Security Analysis and Implementation
slug: quic-http3-security-guide
featured: true
draft: false
tags:
  - networking
  - security
  - http3
  - quic
  - tls
  - performance
category: Security
description: Complete guide to QUIC and HTTP/3 security implications, implementation best practices, and advanced security monitoring techniques
---

# QUIC and HTTP/3 Security: Comprehensive Security Analysis and Implementation

QUIC (Quick UDP Internet Connections) and HTTP/3 represent the next evolution of web protocols, designed to address the performance limitations of HTTP/2 over TCP. While offering significant performance benefits, these protocols introduce new security considerations and attack vectors. This comprehensive guide explores QUIC/HTTP/3 security implications with practical implementation examples and monitoring solutions.

## Table of Contents

## Understanding QUIC and HTTP/3 Architecture

QUIC fundamentally changes how web traffic is transmitted by:

- **UDP-based transport** instead of TCP
- **Built-in encryption** with TLS 1.3
- **Connection migration** across network changes
- **Multiplexed streams** without head-of-line blocking
- **0-RTT connection establishment** for repeat visitors

### QUIC Protocol Stack Visualization

```python
# QUIC Protocol Architecture Analysis
import struct
import socket
import time
import ssl
import hashlib
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum

class QUICPacketType(Enum):
    INITIAL = 0x00
    ZERO_RTT = 0x01
    HANDSHAKE = 0x02
    RETRY = 0x03
    VERSION_NEGOTIATION = 0xff
    SHORT_HEADER = 0x40

@dataclass
class QUICPacket:
    packet_type: QUICPacketType
    version: int
    destination_conn_id: bytes
    source_conn_id: bytes
    payload_length: int
    packet_number: int
    payload: bytes
    encrypted: bool = True
    timestamp: float = 0.0

@dataclass
class QUICConnection:
    connection_id: bytes
    version: int
    peer_address: Tuple[str, int]
    state: str
    encryption_level: str
    rtt_estimate: float
    congestion_window: int
    created_at: float
    last_activity: float

class QUICSecurityAnalyzer:
    """Analyze QUIC traffic for security threats"""
    
    def __init__(self):
        self.connections = {}  # connection_id -> QUICConnection
        self.packet_history = []
        self.security_events = []
        
        # Attack detection thresholds
        self.max_connections_per_ip = 1000
        self.max_packets_per_second = 10000
        self.suspicious_packet_sizes = [1, 2, 3, 4, 65535]  # Common probe sizes
        
    def analyze_packet(self, packet: QUICPacket, source_ip: str) -> Dict:
        """Analyze a QUIC packet for security threats"""
        threats_detected = []
        
        # 1. Connection flooding detection
        if self._detect_connection_flooding(source_ip):
            threats_detected.append("connection_flooding")
        
        # 2. Amplification attack detection
        if self._detect_amplification_attack(packet, source_ip):
            threats_detected.append("amplification_attack")
        
        # 3. 0-RTT replay attack detection
        if self._detect_0rtt_replay(packet):
            threats_detected.append("0rtt_replay")
        
        # 4. Version downgrade detection
        if self._detect_version_downgrade(packet):
            threats_detected.append("version_downgrade")
        
        # 5. Connection migration abuse
        if self._detect_migration_abuse(packet):
            threats_detected.append("migration_abuse")
        
        # Update packet history
        packet.timestamp = time.time()
        self.packet_history.append(packet)
        
        # Maintain sliding window
        cutoff = time.time() - 300  # 5 minutes
        self.packet_history = [p for p in self.packet_history if p.timestamp > cutoff]
        
        analysis_result = {
            'threats': threats_detected,
            'risk_score': self._calculate_risk_score(threats_detected),
            'timestamp': packet.timestamp,
            'packet_type': packet.packet_type.name,
            'source_ip': source_ip
        }
        
        if threats_detected:
            self.security_events.append(analysis_result)
            self._trigger_security_response(analysis_result)
        
        return analysis_result
    
    def _detect_connection_flooding(self, source_ip: str) -> bool:
        """Detect connection flooding attacks"""
        recent_connections = [
            conn for conn in self.connections.values()
            if conn.peer_address[0] == source_ip and
            time.time() - conn.created_at < 60  # Last minute
        ]
        
        return len(recent_connections) > self.max_connections_per_ip / 60
    
    def _detect_amplification_attack(self, packet: QUICPacket, source_ip: str) -> bool:
        """Detect UDP amplification attacks"""
        # Small initial packets that might trigger large responses
        if (packet.packet_type == QUICPacketType.INITIAL and
            packet.payload_length in self.suspicious_packet_sizes):
            return True
        
        # Check for spoofed source addresses (simplified)
        if packet.packet_type == QUICPacketType.VERSION_NEGOTIATION:
            return True  # Version negotiation can be abused
        
        return False
    
    def _detect_0rtt_replay(self, packet: QUICPacket) -> bool:
        """Detect 0-RTT replay attacks"""
        if packet.packet_type != QUICPacketType.ZERO_RTT:
            return False
        
        # Check for duplicate 0-RTT packets
        recent_0rtt = [
            p for p in self.packet_history
            if (p.packet_type == QUICPacketType.ZERO_RTT and
                p.destination_conn_id == packet.destination_conn_id and
                time.time() - p.timestamp < 10)  # Within 10 seconds
        ]
        
        return len(recent_0rtt) > 1
    
    def _detect_version_downgrade(self, packet: QUICPacket) -> bool:
        """Detect version downgrade attacks"""
        if packet.packet_type == QUICPacketType.INITIAL:
            # Check if version is suspiciously old
            known_versions = [0x00000001, 0x1234abcd]  # QUIC v1 and draft versions
            return packet.version not in known_versions
        
        return False
    
    def _detect_migration_abuse(self, packet: QUICPacket) -> bool:
        """Detect connection migration abuse"""
        conn_id = packet.destination_conn_id
        if conn_id in self.connections:
            conn = self.connections[conn_id]
            
            # Too many migrations in short time
            migration_window = 60  # 1 minute
            if time.time() - conn.created_at < migration_window:
                # Count recent activity from different addresses would be checked here
                pass
        
        return False
    
    def _calculate_risk_score(self, threats: List[str]) -> int:
        """Calculate risk score based on detected threats"""
        threat_scores = {
            'connection_flooding': 40,
            'amplification_attack': 60,
            '0rtt_replay': 80,
            'version_downgrade': 30,
            'migration_abuse': 20
        }
        
        total_score = sum(threat_scores.get(threat, 10) for threat in threats)
        return min(total_score, 100)
    
    def _trigger_security_response(self, analysis_result: Dict):
        """Trigger security response based on analysis"""
        risk_score = analysis_result['risk_score']
        source_ip = analysis_result['source_ip']
        
        if risk_score >= 80:
            print(f"🚨 CRITICAL: High-risk QUIC traffic from {source_ip} "
                  f"(Risk: {risk_score}, Threats: {analysis_result['threats']})")
        elif risk_score >= 40:
            print(f"⚠️ WARNING: Suspicious QUIC traffic from {source_ip} "
                  f"(Risk: {risk_score}, Threats: {analysis_result['threats']})")
```

## Security Challenges and Mitigations

### 1. UDP-based Vulnerabilities

QUIC's UDP foundation introduces unique attack vectors:

```python
# UDP-based Attack Detection and Mitigation
import socket
import struct
import time
from collections import defaultdict

class QUICFirewall:
    """Advanced QUIC-aware firewall implementation"""
    
    def __init__(self):
        self.rate_limits = defaultdict(lambda: {'packets': 0, 'window_start': time.time()})
        self.blocked_ips = {}  # IP -> block_until_timestamp
        self.connection_states = {}
        
        # Security policies
        self.policies = {
            'max_packets_per_second': 1000,
            'max_new_connections_per_minute': 100,
            'block_duration': 300,  # 5 minutes
            'enable_amplification_protection': True,
            'require_address_validation': True
        }
    
    def process_quic_packet(self, packet_data: bytes, source_addr: Tuple[str, int],
                           dest_addr: Tuple[str, int]) -> bool:
        """Process QUIC packet and determine if it should be allowed"""
        source_ip = source_addr[0]
        
        # Check if IP is blocked
        if self._is_blocked(source_ip):
            return False
        
        # Parse QUIC packet header
        try:
            packet_info = self._parse_quic_header(packet_data)
        except Exception:
            # Malformed packet
            self._record_violation(source_ip, "malformed_packet")
            return False
        
        # Rate limiting
        if not self._check_rate_limit(source_ip):
            self._block_ip(source_ip, "rate_limit_exceeded")
            return False
        
        # Amplification protection
        if self.policies['enable_amplification_protection']:
            if not self._check_amplification_protection(packet_info, source_addr):
                self._record_violation(source_ip, "amplification_attempt")
                return False
        
        # Address validation for new connections
        if (packet_info['type'] == 'INITIAL' and
            self.policies['require_address_validation']):
            if not self._validate_address(packet_info, source_addr):
                return False
        
        # Update connection state
        self._update_connection_state(packet_info, source_addr)
        
        return True
    
    def _parse_quic_header(self, data: bytes) -> Dict:
        """Parse QUIC packet header"""
        if len(data) < 1:
            raise ValueError("Packet too short")
        
        first_byte = data[0]
        packet_info = {}
        
        # Determine packet type
        if first_byte & 0x80:  # Long header
            if len(data) < 6:
                raise ValueError("Long header packet too short")
            
            packet_type = (first_byte & 0x30) >> 4
            type_names = {0: 'INITIAL', 1: '0RTT', 2: 'HANDSHAKE', 3: 'RETRY'}
            packet_info['type'] = type_names.get(packet_type, 'UNKNOWN')
            
            # Extract version
            version = struct.unpack('!I', data[1:5])[0]
            packet_info['version'] = version
            
            # Extract connection IDs
            dcid_len = data[5]
            if len(data) < 6 + dcid_len:
                raise ValueError("Destination connection ID too short")
            
            packet_info['dest_conn_id'] = data[6:6+dcid_len]
            
            scid_offset = 6 + dcid_len
            if len(data) <= scid_offset:
                raise ValueError("Source connection ID missing")
            
            scid_len = data[scid_offset]
            packet_info['source_conn_id'] = data[scid_offset+1:scid_offset+1+scid_len]
            
        else:  # Short header
            packet_info['type'] = 'SHORT'
            # Extract destination connection ID (variable length, needs connection context)
            # For simplicity, assume first 8 bytes after flags
            packet_info['dest_conn_id'] = data[1:9] if len(data) >= 9 else data[1:]
        
        packet_info['size'] = len(data)
        return packet_info
    
    def _is_blocked(self, ip: str) -> bool:
        """Check if IP address is currently blocked"""
        if ip in self.blocked_ips:
            if time.time() < self.blocked_ips[ip]:
                return True
            else:
                # Block expired
                del self.blocked_ips[ip]
        return False
    
    def _check_rate_limit(self, ip: str) -> bool:
        """Check and update rate limiting for IP address"""
        now = time.time()
        rate_info = self.rate_limits[ip]
        
        # Reset window if needed
        if now - rate_info['window_start'] >= 1.0:  # 1 second window
            rate_info['packets'] = 0
            rate_info['window_start'] = now
        
        rate_info['packets'] += 1
        
        return rate_info['packets'] <= self.policies['max_packets_per_second']
    
    def _check_amplification_protection(self, packet_info: Dict, 
                                       source_addr: Tuple[str, int]) -> bool:
        """Check for amplification attack patterns"""
        # Small initial packets that could trigger large responses
        if (packet_info['type'] == 'INITIAL' and
            packet_info['size'] < 10):  # Suspiciously small
            return False
        
        # Version negotiation abuse
        if (packet_info['type'] == 'INITIAL' and
            packet_info.get('version') == 0):  # Version negotiation trigger
            return False
        
        return True
    
    def _validate_address(self, packet_info: Dict, 
                         source_addr: Tuple[str, int]) -> bool:
        """Implement address validation for new connections"""
        # In a real implementation, this would use:
        # 1. Retry packets with address validation tokens
        # 2. Rate limiting of new connections per IP
        # 3. Geolocation checks
        # 4. Reputation-based filtering
        
        conn_id = packet_info.get('dest_conn_id', b'')
        
        # Simple rate limiting for new connections
        ip = source_addr[0]
        now = time.time()
        
        if ip not in self.connection_states:
            self.connection_states[ip] = {'new_connections': [], 'validated': set()}
        
        state = self.connection_states[ip]
        
        # Clean old entries
        cutoff = now - 60  # 1 minute window
        state['new_connections'] = [t for t in state['new_connections'] if t > cutoff]
        
        # Check rate limit
        if len(state['new_connections']) >= self.policies['max_new_connections_per_minute']:
            return False
        
        # Add to new connections
        state['new_connections'].append(now)
        
        return True
    
    def _update_connection_state(self, packet_info: Dict, 
                                source_addr: Tuple[str, int]):
        """Update connection state tracking"""
        ip = source_addr[0]
        conn_id = packet_info.get('dest_conn_id', b'')
        
        if ip not in self.connection_states:
            self.connection_states[ip] = {'new_connections': [], 'validated': set()}
        
        # Mark connection as having activity
        if packet_info['type'] in ['HANDSHAKE', 'SHORT']:
            self.connection_states[ip]['validated'].add(conn_id)
    
    def _record_violation(self, ip: str, violation_type: str):
        """Record security violation"""
        print(f"🚨 QUIC Security Violation: {violation_type} from {ip}")
        
        # Implement violation scoring and automatic blocking
        # For now, just log the violation
    
    def _block_ip(self, ip: str, reason: str):
        """Block IP address temporarily"""
        block_until = time.time() + self.policies['block_duration']
        self.blocked_ips[ip] = block_until
        
        print(f"🚫 Blocked {ip} for {self.policies['block_duration']} seconds "
              f"(Reason: {reason})")
    
    def get_firewall_stats(self) -> Dict:
        """Get firewall statistics"""
        now = time.time()
        active_blocks = len([ip for ip, until in self.blocked_ips.items() if until > now])
        
        total_connections = sum(
            len(state['validated']) for state in self.connection_states.values()
        )
        
        return {
            'active_blocks': active_blocks,
            'tracked_ips': len(self.rate_limits),
            'total_connections': total_connections,
            'policies': self.policies
        }

# Example usage
firewall = QUICFirewall()

# Simulate processing QUIC packets
sample_packets = [
    # Normal INITIAL packet
    b'\x80\x00\x00\x00\x01\x08\x12\x34\x56\x78\x9a\xbc\xde\xf0\x04\x11\x22\x33\x44',
    # Suspicious small packet
    b'\x80\x00\x00\x00\x01\x00\x00',
    # Short header packet
    b'\x40\x12\x34\x56\x78\x9a\xbc\xde\xf0'
]

for packet in sample_packets:
    allowed = firewall.process_quic_packet(packet, ('192.168.1.100', 12345), ('server.com', 443))
    print(f"Packet allowed: {allowed}")

print("\nFirewall Stats:", firewall.get_firewall_stats())
```

### 2. TLS 1.3 Implementation Security

QUIC mandates TLS 1.3, but implementation flaws can create vulnerabilities:

```python
# QUIC TLS 1.3 Security Validation
import hashlib
import hmac
import secrets
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class QUICTLSValidator:
    """Validate QUIC TLS 1.3 implementation security"""
    
    def __init__(self):
        self.supported_cipher_suites = [
            'TLS_AES_128_GCM_SHA256',
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_CCM_SHA256',
            'TLS_AES_128_CCM_8_SHA256'
        ]
        
        self.supported_groups = [
            'secp256r1', 'secp384r1', 'secp521r1',
            'x25519', 'x448',
            'ffdhe2048', 'ffdhe3072', 'ffdhe4096'
        ]
        
        self.min_tls_version = '1.3'
    
    def validate_handshake(self, client_hello: Dict, server_hello: Dict) -> Dict:
        """Validate QUIC TLS handshake security"""
        issues = []
        
        # 1. TLS version validation
        if not self._validate_tls_version(server_hello):
            issues.append("TLS version < 1.3 not allowed in QUIC")
        
        # 2. Cipher suite validation
        cipher_issues = self._validate_cipher_suite(server_hello)
        issues.extend(cipher_issues)
        
        # 3. Key exchange validation
        kx_issues = self._validate_key_exchange(client_hello, server_hello)
        issues.extend(kx_issues)
        
        # 4. Certificate validation
        cert_issues = self._validate_certificates(server_hello)
        issues.extend(cert_issues)
        
        # 5. 0-RTT security validation
        if client_hello.get('early_data'):
            zero_rtt_issues = self._validate_0rtt_security(client_hello)
            issues.extend(zero_rtt_issues)
        
        # 6. QUIC transport parameters
        transport_issues = self._validate_transport_parameters(server_hello)
        issues.extend(transport_issues)
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'security_level': self._calculate_security_level(issues),
            'recommendations': self._generate_recommendations(issues)
        }
    
    def _validate_tls_version(self, server_hello: Dict) -> bool:
        """Validate TLS version is 1.3"""
        version = server_hello.get('version', '1.2')
        return version == '1.3'
    
    def _validate_cipher_suite(self, server_hello: Dict) -> List[str]:
        """Validate selected cipher suite"""
        issues = []
        
        cipher_suite = server_hello.get('cipher_suite')
        if not cipher_suite:
            issues.append("No cipher suite selected")
            return issues
        
        if cipher_suite not in self.supported_cipher_suites:
            issues.append(f"Unsupported cipher suite: {cipher_suite}")
        
        # Check for weak ciphers (should not exist in TLS 1.3, but double-check)
        weak_patterns = ['RC4', 'DES', 'MD5', 'SHA1', 'NULL']
        for pattern in weak_patterns:
            if pattern in cipher_suite.upper():
                issues.append(f"Weak cipher detected: {pattern} in {cipher_suite}")
        
        return issues
    
    def _validate_key_exchange(self, client_hello: Dict, server_hello: Dict) -> List[str]:
        """Validate key exchange parameters"""
        issues = []
        
        # Validate supported groups
        client_groups = client_hello.get('supported_groups', [])
        selected_group = server_hello.get('key_exchange_group')
        
        if not selected_group:
            issues.append("No key exchange group selected")
            return issues
        
        if selected_group not in self.supported_groups:
            issues.append(f"Unsupported key exchange group: {selected_group}")
        
        if selected_group not in client_groups:
            issues.append(f"Server selected group {selected_group} not offered by client")
        
        # Validate key share
        key_share = server_hello.get('key_share')
        if not key_share:
            issues.append("Missing key share in server hello")
        elif len(key_share) < 32:  # Minimum for reasonable security
            issues.append(f"Key share too short: {len(key_share)} bytes")
        
        return issues
    
    def _validate_certificates(self, server_hello: Dict) -> List[str]:
        """Validate certificate chain"""
        issues = []
        
        cert_chain = server_hello.get('certificate_chain', [])
        if not cert_chain:
            issues.append("No certificate chain provided")
            return issues
        
        # Validate each certificate in chain
        for i, cert_data in enumerate(cert_chain):
            cert_issues = self._validate_single_certificate(cert_data, i == 0)
            issues.extend([f"Cert {i}: {issue}" for issue in cert_issues])
        
        return issues
    
    def _validate_single_certificate(self, cert_data: Dict, is_leaf: bool) -> List[str]:
        """Validate a single certificate"""
        issues = []
        
        # Key size validation
        key_size = cert_data.get('key_size', 0)
        key_type = cert_data.get('key_type', 'unknown')
        
        if key_type == 'RSA' and key_size < 2048:
            issues.append(f"RSA key too small: {key_size} bits")
        elif key_type == 'ECDSA' and key_size < 256:
            issues.append(f"ECDSA key too small: {key_size} bits")
        
        # Expiration validation
        not_after = cert_data.get('not_after')
        if not_after and not_after < time.time():
            issues.append("Certificate has expired")
        
        # Algorithm validation
        signature_alg = cert_data.get('signature_algorithm', '')
        weak_algs = ['md5', 'sha1']
        if any(weak_alg in signature_alg.lower() for weak_alg in weak_algs):
            issues.append(f"Weak signature algorithm: {signature_alg}")
        
        return issues
    
    def _validate_0rtt_security(self, client_hello: Dict) -> List[str]:
        """Validate 0-RTT security parameters"""
        issues = []
        
        # Check for replay protection
        if not client_hello.get('anti_replay_token'):
            issues.append("0-RTT enabled without anti-replay protection")
        
        # Validate max early data size
        max_early_data = client_hello.get('max_early_data_size', 0)
        if max_early_data > 16384:  # 16KB reasonable limit
            issues.append(f"Max early data size too large: {max_early_data} bytes")
        
        # Check for forward secrecy implications
        psk_key_exchange_modes = client_hello.get('psk_key_exchange_modes', [])
        if 'psk_ke' in psk_key_exchange_modes:
            issues.append("PSK-only mode reduces forward secrecy")
        
        return issues
    
    def _validate_transport_parameters(self, server_hello: Dict) -> List[str]:
        """Validate QUIC transport parameters"""
        issues = []
        
        transport_params = server_hello.get('quic_transport_parameters', {})
        
        # Validate initial connection window
        initial_window = transport_params.get('initial_max_stream_data_bidi_local', 0)
        if initial_window > 1048576:  # 1MB reasonable limit
            issues.append(f"Initial stream window too large: {initial_window}")
        
        # Validate idle timeout
        idle_timeout = transport_params.get('idle_timeout', 0)
        if idle_timeout > 600000:  # 10 minutes max
            issues.append(f"Idle timeout too long: {idle_timeout}ms")
        
        # Check for connection migration parameters
        if transport_params.get('disable_active_migration', False):
            # This is actually good for security, but note it
            pass
        
        return issues
    
    def _calculate_security_level(self, issues: List[str]) -> str:
        """Calculate overall security level"""
        critical_patterns = ['expired', 'weak', 'unsupported', 'missing']
        critical_count = sum(
            1 for issue in issues 
            if any(pattern in issue.lower() for pattern in critical_patterns)
        )
        
        if critical_count > 0:
            return 'LOW'
        elif len(issues) > 5:
            return 'MEDIUM'
        elif len(issues) > 0:
            return 'HIGH'
        else:
            return 'EXCELLENT'
    
    def _generate_recommendations(self, issues: List[str]) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        if any('cipher' in issue.lower() for issue in issues):
            recommendations.append("Use only AEAD cipher suites (AES-GCM, ChaCha20-Poly1305)")
        
        if any('key' in issue.lower() for issue in issues):
            recommendations.append("Use RSA keys ≥2048 bits or ECDSA keys ≥256 bits")
        
        if any('0-rtt' in issue.lower() for issue in issues):
            recommendations.append("Implement proper 0-RTT replay protection")
        
        if any('certificate' in issue.lower() for issue in issues):
            recommendations.append("Maintain valid certificate chain with strong algorithms")
        
        return recommendations

# Example validation
validator = QUICTLSValidator()

# Simulate handshake data
client_hello = {
    'version': '1.3',
    'supported_groups': ['x25519', 'secp256r1'],
    'cipher_suites': ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'],
    'early_data': True,
    'max_early_data_size': 8192,
    'anti_replay_token': 'present'
}

server_hello = {
    'version': '1.3',
    'cipher_suite': 'TLS_AES_256_GCM_SHA384',
    'key_exchange_group': 'x25519',
    'key_share': b'x' * 32,  # 32 bytes key share
    'certificate_chain': [{
        'key_type': 'ECDSA',
        'key_size': 256,
        'signature_algorithm': 'sha256WithECDSA',
        'not_after': time.time() + 86400 * 365,  # Valid for 1 year
    }],
    'quic_transport_parameters': {
        'initial_max_stream_data_bidi_local': 65536,
        'idle_timeout': 30000,  # 30 seconds
        'disable_active_migration': True
    }
}

result = validator.validate_handshake(client_hello, server_hello)
print(f"Handshake validation result: {result}")
```

### 3. Connection Migration Security

Connection migration allows QUIC connections to survive network changes but introduces security risks:

```python
# QUIC Connection Migration Security Monitor
import time
import hashlib
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Set, Tuple

@dataclass
class MigrationEvent:
    connection_id: bytes
    old_address: Tuple[str, int]
    new_address: Tuple[str, int]
    timestamp: float
    validation_token: bytes
    authenticated: bool

class ConnectionMigrationMonitor:
    """Monitor and secure QUIC connection migrations"""
    
    def __init__(self):
        self.active_connections = {}  # conn_id -> connection info
        self.migration_history = []
        self.suspicious_patterns = []
        
        # Security policies
        self.max_migrations_per_hour = 10
        self.max_distance_km = 500  # Geographic distance
        self.require_validation = True
        self.block_tor_exits = True
        
    def handle_migration_event(self, event: MigrationEvent) -> bool:
        """Process a connection migration event"""
        # Validate the migration
        if not self._validate_migration(event):
            self._record_suspicious_migration(event, "validation_failed")
            return False
        
        # Check for abuse patterns
        if self._detect_migration_abuse(event):
            self._record_suspicious_migration(event, "abuse_pattern")
            return False
        
        # Check geographic constraints
        if not self._validate_geographic_migration(event):
            self._record_suspicious_migration(event, "geographic_violation")
            return False
        
        # Update connection state
        self._update_connection_state(event)
        
        # Record successful migration
        self.migration_history.append(event)
        
        print(f"✅ Connection migration allowed: "
              f"{event.old_address[0]} -> {event.new_address[0]}")
        
        return True
    
    def _validate_migration(self, event: MigrationEvent) -> bool:
        """Validate migration authentication"""
        if not self.require_validation:
            return True
        
        # Check if connection exists and is authenticated
        if event.connection_id not in self.active_connections:
            return False
        
        conn_info = self.active_connections[event.connection_id]
        
        # Validate migration token
        expected_token = self._generate_validation_token(
            event.connection_id,
            event.new_address,
            conn_info['migration_key']
        )
        
        return hmac.compare_digest(event.validation_token, expected_token)
    
    def _detect_migration_abuse(self, event: MigrationEvent) -> bool:
        """Detect migration abuse patterns"""
        # Count recent migrations for this connection
        recent_migrations = [
            m for m in self.migration_history
            if (m.connection_id == event.connection_id and
                time.time() - m.timestamp < 3600)  # Last hour
        ]
        
        if len(recent_migrations) >= self.max_migrations_per_hour:
            return True
        
        # Detect rapid back-and-forth migrations
        if len(recent_migrations) >= 2:
            last_migration = recent_migrations[-1]
            if (event.new_address == last_migration.old_address and
                time.time() - last_migration.timestamp < 60):  # Within 1 minute
                return True
        
        # Detect migration to known malicious networks
        if self._is_malicious_network(event.new_address[0]):
            return True
        
        return False
    
    def _validate_geographic_migration(self, event: MigrationEvent) -> bool:
        """Validate geographic feasibility of migration"""
        old_location = self._get_location(event.old_address[0])
        new_location = self._get_location(event.new_address[0])
        
        if not old_location or not new_location:
            # Can't determine locations, allow migration
            return True
        
        # Calculate distance
        distance = self._calculate_distance(old_location, new_location)
        
        # Check if distance is feasible given time since last migration
        conn_info = self.active_connections.get(event.connection_id, {})
        last_migration_time = conn_info.get('last_migration', 0)
        time_diff = event.timestamp - last_migration_time
        
        # Assume maximum speed of 1000 km/h (commercial aircraft)
        max_distance = (time_diff / 3600) * 1000
        
        return distance <= max_distance
    
    def _generate_validation_token(self, conn_id: bytes, 
                                 new_address: Tuple[str, int],
                                 migration_key: bytes) -> bytes:
        """Generate validation token for migration"""
        data = conn_id + new_address[0].encode() + new_address[1].to_bytes(2, 'big')
        return hmac.new(migration_key, data, hashlib.sha256).digest()
    
    def _is_malicious_network(self, ip: str) -> bool:
        """Check if IP belongs to malicious network"""
        # In practice, this would check against:
        # - Tor exit nodes
        # - Known botnets
        # - Malware C&C networks
        # - Open proxies
        
        # Simplified check for Tor (example ranges)
        tor_ranges = [
            '103.251.167.0/24',
            '185.220.100.0/24',
            '199.87.154.0/24'
        ]
        
        for tor_range in tor_ranges:
            if self._ip_in_range(ip, tor_range):
                return True
        
        return False
    
    def _get_location(self, ip: str) -> Optional[Tuple[float, float]]:
        """Get geographic location for IP address"""
        # In practice, this would use MaxMind GeoIP or similar
        # For demo, return sample coordinates
        location_map = {
            '192.168.1.100': (37.7749, -122.4194),  # San Francisco
            '10.0.0.100': (40.7128, -74.0060),      # New York
            '172.16.0.100': (51.5074, -0.1278),     # London
        }
        
        return location_map.get(ip)
    
    def _calculate_distance(self, loc1: Tuple[float, float], 
                          loc2: Tuple[float, float]) -> float:
        """Calculate distance between two geographic points"""
        import math
        
        lat1, lon1 = math.radians(loc1[0]), math.radians(loc1[1])
        lat2, lon2 = math.radians(loc2[0]), math.radians(loc2[1])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        # Haversine formula
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in kilometers
        return 6371 * c
    
    def _ip_in_range(self, ip: str, cidr: str) -> bool:
        """Check if IP is in CIDR range"""
        import ipaddress
        try:
            return ipaddress.ip_address(ip) in ipaddress.ip_network(cidr)
        except:
            return False
    
    def _update_connection_state(self, event: MigrationEvent):
        """Update connection state after successful migration"""
        conn_id = event.connection_id
        
        if conn_id not in self.active_connections:
            self.active_connections[conn_id] = {
                'migration_key': secrets.token_bytes(32),
                'created_at': time.time()
            }
        
        conn_info = self.active_connections[conn_id]
        conn_info['current_address'] = event.new_address
        conn_info['last_migration'] = event.timestamp
        conn_info['migration_count'] = conn_info.get('migration_count', 0) + 1
    
    def _record_suspicious_migration(self, event: MigrationEvent, reason: str):
        """Record suspicious migration attempt"""
        suspicious_event = {
            'event': event,
            'reason': reason,
            'timestamp': time.time()
        }
        
        self.suspicious_patterns.append(suspicious_event)
        
        print(f"🚨 Suspicious migration blocked: {reason} "
              f"({event.old_address[0]} -> {event.new_address[0]})")
    
    def get_security_report(self) -> Dict:
        """Generate security report for connection migrations"""
        total_migrations = len(self.migration_history)
        suspicious_count = len(self.suspicious_patterns)
        
        # Analyze patterns
        by_reason = defaultdict(int)
        for pattern in self.suspicious_patterns:
            by_reason[pattern['reason']] += 1
        
        # Top migrating connections
        migration_counts = defaultdict(int)
        for migration in self.migration_history:
            migration_counts[migration.connection_id] += 1
        
        top_migrators = sorted(migration_counts.items(), 
                              key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'total_migrations': total_migrations,
            'suspicious_attempts': suspicious_count,
            'success_rate': ((total_migrations / (total_migrations + suspicious_count)) 
                           if total_migrations + suspicious_count > 0 else 0),
            'suspicious_by_reason': dict(by_reason),
            'top_migrating_connections': [
                {'connection_id': conn_id.hex(), 'count': count}
                for conn_id, count in top_migrators
            ],
            'active_connections': len(self.active_connections)
        }

# Example usage
monitor = ConnectionMigrationMonitor()

# Simulate migration events
events = [
    MigrationEvent(
        connection_id=b'\x12\x34\x56\x78',
        old_address=('192.168.1.100', 12345),
        new_address=('10.0.0.100', 12345),
        timestamp=time.time(),
        validation_token=b'valid_token',
        authenticated=True
    ),
    MigrationEvent(
        connection_id=b'\x12\x34\x56\x78',
        old_address=('10.0.0.100', 12345),
        new_address=('172.16.0.100', 12345),
        timestamp=time.time() + 30,  # 30 seconds later
        validation_token=b'invalid_token',
        authenticated=False
    )
]

for event in events:
    monitor.handle_migration_event(event)

print("\nSecurity Report:", monitor.get_security_report())
```

## HTTP/3 Implementation Security

### Secure HTTP/3 Server Configuration

```python
# Secure HTTP/3 Server Implementation
import asyncio
import ssl
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class HTTP3SecurityConfig:
    max_request_size: int = 1048576  # 1MB
    max_header_size: int = 32768     # 32KB
    max_concurrent_streams: int = 100
    enable_server_push: bool = False  # Disabled by default for security
    require_sni: bool = True
    enable_0rtt: bool = False        # Disabled by default
    strict_transport_security: str = "max-age=31536000; includeSubDomains"
    content_security_policy: str = "default-src 'self'"
    
class HTTP3SecureServer:
    """Secure HTTP/3 server implementation"""
    
    def __init__(self, config: HTTP3SecurityConfig):
        self.config = config
        self.active_connections = {}
        self.request_rate_limits = {}
        self.security_headers = self._build_security_headers()
        
    def _build_security_headers(self) -> Dict[str, str]:
        """Build default security headers"""
        return {
            'Strict-Transport-Security': self.config.strict_transport_security,
            'Content-Security-Policy': self.config.content_security_policy,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin'
        }
    
    async def handle_request(self, request: Dict) -> Dict:
        """Handle HTTP/3 request with security checks"""
        # 1. Validate request size
        if not self._validate_request_size(request):
            return self._create_error_response(413, "Request Too Large")
        
        # 2. Validate headers
        if not self._validate_headers(request.get('headers', {})):
            return self._create_error_response(400, "Invalid Headers")
        
        # 3. Rate limiting
        client_ip = request.get('client_ip', 'unknown')
        if not self._check_rate_limit(client_ip):
            return self._create_error_response(429, "Too Many Requests")
        
        # 4. Path traversal protection
        path = request.get('path', '/')
        if not self._validate_path(path):
            return self._create_error_response(400, "Invalid Path")
        
        # 5. Process request
        response = await self._process_request(request)
        
        # 6. Add security headers
        response['headers'].update(self.security_headers)
        
        # 7. Log request for monitoring
        self._log_request(request, response)
        
        return response
    
    def _validate_request_size(self, request: Dict) -> bool:
        """Validate request size limits"""
        body_size = len(request.get('body', b''))
        if body_size > self.config.max_request_size:
            return False
        
        headers_size = sum(
            len(str(k)) + len(str(v)) 
            for k, v in request.get('headers', {}).items()
        )
        if headers_size > self.config.max_header_size:
            return False
        
        return True
    
    def _validate_headers(self, headers: Dict[str, str]) -> bool:
        """Validate HTTP headers for security"""
        # Check for required headers
        if self.config.require_sni and 'host' not in headers:
            return False
        
        # Validate header values
        for name, value in headers.items():
            # Check for header injection
            if '\r' in value or '\n' in value:
                return False
            
            # Validate specific headers
            if name.lower() == 'content-length':
                try:
                    content_length = int(value)
                    if content_length > self.config.max_request_size:
                        return False
                except ValueError:
                    return False
        
        return True
    
    def _validate_path(self, path: str) -> bool:
        """Validate request path for security"""
        # Path traversal protection
        if '..' in path or '~' in path:
            return False
        
        # Null byte injection protection
        if '\x00' in path:
            return False
        
        # Control character protection
        if any(ord(c) < 32 for c in path if c not in '\t\n\r'):
            return False
        
        return True
    
    def _check_rate_limit(self, client_ip: str) -> bool:
        """Check rate limiting for client"""
        now = datetime.now()
        
        if client_ip not in self.request_rate_limits:
            self.request_rate_limits[client_ip] = {
                'requests': [],
                'blocked_until': None
            }
        
        rate_info = self.request_rate_limits[client_ip]
        
        # Check if currently blocked
        if rate_info['blocked_until'] and now < rate_info['blocked_until']:
            return False
        
        # Clean old requests (sliding window)
        cutoff = now - timedelta(minutes=1)
        rate_info['requests'] = [
            req_time for req_time in rate_info['requests'] 
            if req_time > cutoff
        ]
        
        # Check rate limit (100 requests per minute)
        if len(rate_info['requests']) >= 100:
            # Block for 5 minutes
            rate_info['blocked_until'] = now + timedelta(minutes=5)
            return False
        
        # Record this request
        rate_info['requests'].append(now)
        return True
    
    async def _process_request(self, request: Dict) -> Dict:
        """Process the actual HTTP request"""
        method = request.get('method', 'GET')
        path = request.get('path', '/')
        headers = request.get('headers', {})
        
        # Basic routing
        if path == '/':
            return {
                'status': 200,
                'headers': {'content-type': 'text/html'},
                'body': b'<html><body><h1>Secure HTTP/3 Server</h1></body></html>'
            }
        elif path == '/health':
            return {
                'status': 200,
                'headers': {'content-type': 'application/json'},
                'body': b'{"status": "healthy"}'
            }
        else:
            return self._create_error_response(404, "Not Found")
    
    def _create_error_response(self, status: int, message: str) -> Dict:
        """Create error response"""
        return {
            'status': status,
            'headers': {'content-type': 'text/plain'},
            'body': message.encode()
        }
    
    def _log_request(self, request: Dict, response: Dict):
        """Log request for security monitoring"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'client_ip': request.get('client_ip', 'unknown'),
            'method': request.get('method', 'UNKNOWN'),
            'path': request.get('path', '/'),
            'status': response['status'],
            'user_agent': request.get('headers', {}).get('user-agent', 'unknown')
        }
        
        # Log to security monitoring system
        if response['status'] >= 400:
            logging.warning(f"HTTP/3 Error: {log_entry}")
        else:
            logging.info(f"HTTP/3 Request: {log_entry}")

# HTTP/3 Security Middleware
class HTTP3SecurityMiddleware:
    """Security middleware for HTTP/3 applications"""
    
    def __init__(self):
        self.blocked_ips = set()
        self.attack_patterns = [
            r'<script',           # XSS attempts
            r'javascript:',       # JavaScript injection
            r'SELECT.*FROM',      # SQL injection
            r'UNION.*SELECT',     # SQL injection
            r'\.\./',            # Path traversal
            r'%2e%2e%2f',        # URL encoded path traversal
        ]
    
    async def process_request(self, request: Dict) -> Optional[Dict]:
        """Process request through security middleware"""
        client_ip = request.get('client_ip', 'unknown')
        
        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            return self._create_blocked_response()
        
        # Scan for attack patterns
        if self._detect_attack_patterns(request):
            self.blocked_ips.add(client_ip)
            logging.error(f"Attack detected from {client_ip}, IP blocked")
            return self._create_blocked_response()
        
        # Request is clean, continue processing
        return None
    
    def _detect_attack_patterns(self, request: Dict) -> bool:
        """Detect common attack patterns in request"""
        # Check path
        path = request.get('path', '')
        for pattern in self.attack_patterns:
            import re
            if re.search(pattern, path, re.IGNORECASE):
                return True
        
        # Check headers
        headers = request.get('headers', {})
        for name, value in headers.items():
            for pattern in self.attack_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    return True
        
        # Check body
        body = request.get('body', b'').decode('utf-8', errors='ignore')
        for pattern in self.attack_patterns:
            if re.search(pattern, body, re.IGNORECASE):
                return True
        
        return False
    
    def _create_blocked_response(self) -> Dict:
        """Create response for blocked requests"""
        return {
            'status': 403,
            'headers': {'content-type': 'text/plain'},
            'body': b'Access Denied'
        }

# Example usage
config = HTTP3SecurityConfig(
    max_request_size=524288,  # 512KB
    enable_0rtt=False,
    strict_transport_security="max-age=31536000; includeSubDomains; preload"
)

server = HTTP3SecureServer(config)
middleware = HTTP3SecurityMiddleware()

# Simulate request processing
async def handle_client_request(request: Dict):
    # Apply security middleware
    blocked_response = await middleware.process_request(request)
    if blocked_response:
        return blocked_response
    
    # Process through secure server
    return await server.handle_request(request)

# Test with sample requests
sample_requests = [
    {
        'method': 'GET',
        'path': '/',
        'headers': {'host': 'example.com'},
        'client_ip': '192.168.1.100',
        'body': b''
    },
    {
        'method': 'GET',
        'path': '/../../etc/passwd',
        'headers': {'host': 'example.com'},
        'client_ip': '192.168.1.101',
        'body': b''
    },
    {
        'method': 'POST',
        'path': '/login',
        'headers': {
            'host': 'example.com',
            'content-type': 'application/x-www-form-urlencoded'
        },
        'client_ip': '192.168.1.102',
        'body': b"username=admin&password='; DROP TABLE users; --"
    }
]

# Process sample requests
async def test_requests():
    for request in sample_requests:
        response = await handle_client_request(request)
        print(f"Request: {request['path']} -> Status: {response['status']}")

asyncio.run(test_requests())
```

## Monitoring and Detection

### Real-time QUIC/HTTP3 Security Monitor

```bash
#!/bin/bash
# quic_http3_monitor.sh - Comprehensive QUIC/HTTP3 Security Monitor

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/quic-security"
CONFIG_FILE="/etc/quic-monitor.conf"

# Create directories
sudo mkdir -p "$LOG_DIR"
sudo chown "$USER:$USER" "$LOG_DIR"

# Default configuration
cat > "$CONFIG_FILE" << EOF
# QUIC/HTTP3 Security Monitor Configuration
MONITOR_INTERFACE=eth0
QUIC_PORT=443
ALERT_THRESHOLD_PPS=1000
ALERT_THRESHOLD_BPS=100000000
ENABLE_GEOLOCATION=true
ENABLE_REPUTATION_CHECKS=true
BLOCKED_COUNTRIES="CN,RU,KP"
WHITELIST_IPS="10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
ELASTICSEARCH_URL="http://localhost:9200"
GRAFANA_URL="http://localhost:3000"
EOF

echo "📊 QUIC/HTTP3 Security Monitor Setup"
echo "====================================="

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Update package list
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        tshark \
        tcpdump \
        python3-pip \
        python3-venv \
        jq \
        curl \
        geoip-bin \
        geoip-database \
        fail2ban
    
    # Install Python packages
    pip3 install --user \
        scapy \
        dpkt \
        geoip2 \
        elasticsearch \
        requests \
        matplotlib \
        pandas \
        asyncio
    
    echo "✅ Dependencies installed"
}

# Setup packet capture for QUIC traffic
setup_packet_capture() {
    echo "🔍 Setting up QUIC packet capture..."
    
    # Create tcpdump capture script
    cat > "${LOG_DIR}/capture_quic.sh" << 'EOF'
#!/bin/bash
INTERFACE=${1:-eth0}
LOGFILE="${2:-/var/log/quic-security/quic_packets.pcap}"

# Capture QUIC traffic (UDP on port 443 and 80)
tcpdump -i "$INTERFACE" -w "$LOGFILE" -C 100 -W 10 \
    '(udp port 443) or (udp port 80) or (udp portrange 443-8443)'
EOF
    
    chmod +x "${LOG_DIR}/capture_quic.sh"
    
    # Create packet analysis script
    cat > "${LOG_DIR}/analyze_packets.py" << 'EOF'
#!/usr/bin/env python3
import dpkt
import socket
import struct
import json
import time
from collections import defaultdict
import geoip2.database

class QUICPacketAnalyzer:
    def __init__(self, pcap_file, geoip_db_path='/usr/share/GeoIP/GeoLite2-Country.mmdb'):
        self.pcap_file = pcap_file
        self.stats = defaultdict(int)
        self.suspicious_ips = set()
        self.connection_stats = defaultdict(lambda: {'packets': 0, 'bytes': 0})
        
        try:
            self.geoip_reader = geoip2.database.Reader(geoip_db_path)
        except:
            self.geoip_reader = None
            print("Warning: GeoIP database not available")
    
    def analyze(self):
        """Analyze PCAP file for QUIC traffic"""
        with open(self.pcap_file, 'rb') as f:
            pcap = dpkt.pcap.Reader(f)
            
            for timestamp, buf in pcap:
                try:
                    self._analyze_packet(timestamp, buf)
                except Exception as e:
                    continue
        
        return self._generate_report()
    
    def _analyze_packet(self, timestamp, buf):
        """Analyze individual packet"""
        eth = dpkt.ethernet.Ethernet(buf)
        if not isinstance(eth.data, dpkt.ip.IP):
            return
        
        ip = eth.data
        if not isinstance(ip.data, dpkt.udp.UDP):
            return
        
        udp = ip.data
        
        # Check if this looks like QUIC (heuristic)
        if not self._is_quic_packet(udp.data):
            return
        
        src_ip = socket.inet_ntoa(ip.src)
        dst_ip = socket.inet_ntoa(ip.dst)
        
        # Update statistics
        self.stats['total_packets'] += 1
        self.stats['total_bytes'] += len(buf)
        
        # Track connection
        conn_key = f"{src_ip}:{udp.sport}->{dst_ip}:{udp.dport}"
        self.connection_stats[conn_key]['packets'] += 1
        self.connection_stats[conn_key]['bytes'] += len(udp.data)
        
        # Analyze for suspicious patterns
        self._check_suspicious_patterns(src_ip, dst_ip, udp.data, timestamp)
    
    def _is_quic_packet(self, data):
        """Heuristic to identify QUIC packets"""
        if len(data) < 1:
            return False
        
        first_byte = data[0]
        
        # Check for QUIC long header
        if first_byte & 0x80:
            if len(data) >= 5:
                # Check version field
                version = struct.unpack('!I', data[1:5])[0]
                # Known QUIC versions or version negotiation
                return version == 0 or version == 1 or (version & 0x0f0f0f0f) == 0x0a0a0a0a
        
        # Short header packets are harder to identify reliably
        return True
    
    def _check_suspicious_patterns(self, src_ip, dst_ip, data, timestamp):
        """Check for suspicious QUIC traffic patterns"""
        # Very small packets (potential probes)
        if len(data) < 10:
            self.stats['small_packets'] += 1
            if len(data) <= 3:
                self.suspicious_ips.add(src_ip)
        
        # Very large packets (potential attacks)
        if len(data) > 1200:
            self.stats['large_packets'] += 1
        
        # Geographic checks
        if self.geoip_reader:
            try:
                response = self.geoip_reader.country(src_ip)
                country = response.country.iso_code
                
                # Check against blocked countries
                blocked_countries = ['CN', 'RU', 'KP']  # Example list
                if country in blocked_countries:
                    self.suspicious_ips.add(src_ip)
                    self.stats[f'blocked_country_{country}'] += 1
            except:
                pass
    
    def _generate_report(self):
        """Generate analysis report"""
        # Find top talkers
        top_connections = sorted(
            self.connection_stats.items(),
            key=lambda x: x[1]['bytes'],
            reverse=True
        )[:10]
        
        report = {
            'timestamp': time.time(),
            'statistics': dict(self.stats),
            'suspicious_ips': list(self.suspicious_ips),
            'top_connections': [
                {
                    'connection': conn,
                    'packets': stats['packets'],
                    'bytes': stats['bytes']
                }
                for conn, stats in top_connections
            ],
            'analysis_summary': {
                'total_unique_connections': len(self.connection_stats),
                'suspicious_ip_count': len(self.suspicious_ips),
                'small_packet_percentage': (
                    (self.stats['small_packets'] / self.stats['total_packets']) * 100
                    if self.stats['total_packets'] > 0 else 0
                )
            }
        }
        
        return report

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: analyze_packets.py <pcap_file>")
        sys.exit(1)
    
    analyzer = QUICPacketAnalyzer(sys.argv[1])
    report = analyzer.analyze()
    
    print(json.dumps(report, indent=2))
EOF
    
    chmod +x "${LOG_DIR}/analyze_packets.py"
    
    echo "✅ Packet capture setup complete"
}

# Setup monitoring dashboard
setup_monitoring_dashboard() {
    echo "📈 Setting up monitoring dashboard..."
    
    # Create real-time monitor script
    cat > "${LOG_DIR}/realtime_monitor.py" << 'EOF'
#!/usr/bin/env python3
import time
import subprocess
import json
import asyncio
from datetime import datetime, timedelta

class QUICRealtimeMonitor:
    def __init__(self):
        self.stats_history = []
        self.alerts = []
        self.alert_thresholds = {
            'packets_per_second': 1000,
            'bytes_per_second': 100 * 1024 * 1024,  # 100 MB/s
            'suspicious_ip_threshold': 10
        }
    
    async def monitor_loop(self):
        """Main monitoring loop"""
        print("🔍 Starting QUIC/HTTP3 real-time monitoring...")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                stats = await self.collect_stats()
                self.process_stats(stats)
                
                # Check for alerts
                self.check_alerts(stats)
                
                # Display current status
                self.display_status(stats)
                
                await asyncio.sleep(10)  # Monitor every 10 seconds
                
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped")
    
    async def collect_stats(self):
        """Collect current network statistics"""
        try:
            # Use netstat to get connection stats
            result = subprocess.run(
                ['netstat', '-u', '-n'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            udp_connections = 0
            for line in result.stdout.split('\n'):
                if ':443' in line or ':80' in line:
                    udp_connections += 1
            
            # Get interface statistics
            with open('/proc/net/dev', 'r') as f:
                dev_stats = f.read()
            
            stats = {
                'timestamp': time.time(),
                'udp_connections': udp_connections,
                'packets_per_second': 0,  # Would be calculated from previous sample
                'bytes_per_second': 0,    # Would be calculated from previous sample
            }
            
            return stats
            
        except Exception as e:
            print(f"Error collecting stats: {e}")
            return {'timestamp': time.time(), 'error': str(e)}
    
    def process_stats(self, stats):
        """Process collected statistics"""
        self.stats_history.append(stats)
        
        # Keep only last hour of data
        cutoff = time.time() - 3600
        self.stats_history = [
            s for s in self.stats_history 
            if s['timestamp'] > cutoff
        ]
        
        # Calculate rates if we have previous data
        if len(self.stats_history) >= 2:
            prev_stats = self.stats_history[-2]
            time_diff = stats['timestamp'] - prev_stats['timestamp']
            
            if time_diff > 0:
                # Calculate packet rate (would need actual packet counts)
                stats['packets_per_second'] = 0  # Placeholder
                stats['bytes_per_second'] = 0    # Placeholder
    
    def check_alerts(self, stats):
        """Check for alert conditions"""
        alerts_triggered = []
        
        # Check packet rate
        if stats.get('packets_per_second', 0) > self.alert_thresholds['packets_per_second']:
            alerts_triggered.append(
                f"High packet rate: {stats['packets_per_second']} pps"
            )
        
        # Check byte rate
        if stats.get('bytes_per_second', 0) > self.alert_thresholds['bytes_per_second']:
            alerts_triggered.append(
                f"High bandwidth usage: {stats['bytes_per_second'] / (1024*1024):.2f} MB/s"
            )
        
        # Log alerts
        for alert in alerts_triggered:
            alert_entry = {
                'timestamp': datetime.now().isoformat(),
                'alert': alert,
                'stats': stats
            }
            self.alerts.append(alert_entry)
            print(f"🚨 ALERT: {alert}")
    
    def display_status(self, stats):
        """Display current monitoring status"""
        print(f"\r[{datetime.now().strftime('%H:%M:%S')}] "
              f"UDP Connections: {stats.get('udp_connections', 0)} | "
              f"Alerts: {len([a for a in self.alerts if time.time() - time.mktime(time.strptime(a['timestamp'].split('.')[0], '%Y-%m-%dT%H:%M:%S')) < 300])}", 
              end='', flush=True)

if __name__ == "__main__":
    monitor = QUICRealtimeMonitor()
    asyncio.run(monitor.monitor_loop())
EOF
    
    chmod +x "${LOG_DIR}/realtime_monitor.py"
    
    echo "✅ Monitoring dashboard setup complete"
}

# Setup alerting system
setup_alerting() {
    echo "🚨 Setting up alerting system..."
    
    # Create alert handler script
    cat > "${LOG_DIR}/alert_handler.py" << 'EOF'
#!/usr/bin/env python3
import json
import smtplib
import requests
from email.mime.text import MIMEText
from datetime import datetime

class AlertHandler:
    def __init__(self, config_file='/etc/quic-monitor.conf'):
        self.config = self.load_config(config_file)
    
    def load_config(self, config_file):
        """Load configuration"""
        config = {
            'smtp_server': 'localhost',
            'smtp_port': 587,
            'email_from': 'quic-monitor@localhost',
            'email_to': 'admin@localhost',
            'slack_webhook': None,
            'teams_webhook': None
        }
        
        try:
            with open(config_file, 'r') as f:
                # Simple config parsing
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        config[key.lower()] = value
        except FileNotFoundError:
            pass
        
        return config
    
    def send_alert(self, alert_data):
        """Send alert via configured methods"""
        message = self.format_alert_message(alert_data)
        
        # Send email
        if self.config.get('email_to'):
            self.send_email_alert(message, alert_data)
        
        # Send to Slack
        if self.config.get('slack_webhook'):
            self.send_slack_alert(message, alert_data)
        
        # Send to Teams
        if self.config.get('teams_webhook'):
            self.send_teams_alert(message, alert_data)
    
    def format_alert_message(self, alert_data):
        """Format alert message"""
        severity = alert_data.get('severity', 'MEDIUM')
        alert_type = alert_data.get('type', 'SECURITY')
        description = alert_data.get('description', 'Security event detected')
        
        message = f"""
QUIC/HTTP3 Security Alert

Severity: {severity}
Type: {alert_type}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Description: {description}

Details:
{json.dumps(alert_data.get('details', {}), indent=2)}
"""
        return message
    
    def send_email_alert(self, message, alert_data):
        """Send email alert"""
        try:
            msg = MIMEText(message)
            msg['Subject'] = f"QUIC Security Alert - {alert_data.get('severity', 'MEDIUM')}"
            msg['From'] = self.config['email_from']
            msg['To'] = self.config['email_to']
            
            with smtplib.SMTP(self.config['smtp_server'], self.config['smtp_port']) as server:
                server.send_message(msg)
            
            print("📧 Email alert sent")
        except Exception as e:
            print(f"Failed to send email alert: {e}")
    
    def send_slack_alert(self, message, alert_data):
        """Send Slack alert"""
        try:
            payload = {
                'text': f"QUIC Security Alert - {alert_data.get('severity', 'MEDIUM')}",
                'attachments': [{
                    'color': 'danger' if alert_data.get('severity') == 'HIGH' else 'warning',
                    'text': message
                }]
            }
            
            response = requests.post(self.config['slack_webhook'], json=payload)
            response.raise_for_status()
            
            print("📱 Slack alert sent")
        except Exception as e:
            print(f"Failed to send Slack alert: {e}")
    
    def send_teams_alert(self, message, alert_data):
        """Send Microsoft Teams alert"""
        try:
            payload = {
                '@type': 'MessageCard',
                '@context': 'http://schema.org/extensions',
                'themeColor': 'FF0000' if alert_data.get('severity') == 'HIGH' else 'FFA500',
                'summary': f"QUIC Security Alert - {alert_data.get('severity', 'MEDIUM')}",
                'sections': [{
                    'activityTitle': 'QUIC/HTTP3 Security Alert',
                    'activitySubtitle': alert_data.get('description', 'Security event detected'),
                    'text': message,
                    'markdown': True
                }]
            }
            
            response = requests.post(self.config['teams_webhook'], json=payload)
            response.raise_for_status()
            
            print("📢 Teams alert sent")
        except Exception as e:
            print(f"Failed to send Teams alert: {e}")

# Test alert
if __name__ == "__main__":
    handler = AlertHandler()
    
    test_alert = {
        'severity': 'HIGH',
        'type': 'DDoS_ATTACK',
        'description': 'Potential DDoS attack detected via QUIC amplification',
        'details': {
            'source_ip': '192.168.1.100',
            'packets_per_second': 50000,
            'attack_type': 'amplification'
        }
    }
    
    handler.send_alert(test_alert)
EOF
    
    chmod +x "${LOG_DIR}/alert_handler.py"
    
    echo "✅ Alerting system setup complete"
}

# Create systemd services
create_systemd_services() {
    echo "⚙️ Creating systemd services..."
    
    # QUIC packet capture service
    sudo tee /etc/systemd/system/quic-capture.service > /dev/null << EOF
[Unit]
Description=QUIC Packet Capture Service
After=network.target

[Service]
Type=simple
ExecStart=${LOG_DIR}/capture_quic.sh eth0 ${LOG_DIR}/quic_packets.pcap
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF
    
    # QUIC monitoring service
    sudo tee /etc/systemd/system/quic-monitor.service > /dev/null << EOF
[Unit]
Description=QUIC Security Monitor
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 ${LOG_DIR}/realtime_monitor.py
Restart=always
RestartSec=10
User=$USER
WorkingDirectory=${LOG_DIR}

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable quic-capture.service
    sudo systemctl enable quic-monitor.service
    
    echo "✅ Systemd services created"
}

# Main installation function
main() {
    echo "🚀 Installing QUIC/HTTP3 Security Monitor..."
    
    install_dependencies
    setup_packet_capture
    setup_monitoring_dashboard
    setup_alerting
    create_systemd_services
    
    echo ""
    echo "✅ QUIC/HTTP3 Security Monitor Installation Complete!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Review configuration: $CONFIG_FILE"
    echo "2. Start services: sudo systemctl start quic-capture quic-monitor"
    echo "3. View logs: tail -f ${LOG_DIR}/quic_packets.pcap"
    echo "4. Run analysis: python3 ${LOG_DIR}/analyze_packets.py ${LOG_DIR}/quic_packets.pcap"
    echo ""
    echo "📊 Monitoring Commands:"
    echo "  - Real-time monitor: python3 ${LOG_DIR}/realtime_monitor.py"
    echo "  - Service status: sudo systemctl status quic-monitor"
    echo "  - View alerts: journalctl -u quic-monitor -f"
}

# Run main function
main "$@"
```

## Conclusion

QUIC and HTTP/3 represent a significant evolution in web protocols, offering improved performance through reduced latency and better multiplexing. However, their UDP-based nature and new features introduce unique security challenges:

### Key Security Considerations

1. **UDP Amplification Risks**: Implement proper rate limiting and validation
2. **0-RTT Replay Attacks**: Use proper replay protection mechanisms
3. **Connection Migration Security**: Validate migrations and detect abuse
4. **TLS 1.3 Implementation**: Ensure proper certificate validation and cipher selection
5. **Monitoring Complexity**: UDP traffic requires specialized monitoring tools

### Best Practices

1. **Disable 0-RTT by default** until proper replay protection is implemented
2. **Implement comprehensive rate limiting** at multiple layers
3. **Monitor for amplification attacks** and suspicious traffic patterns
4. **Use strong TLS 1.3 configurations** with proper cipher suites
5. **Deploy geographic and reputation-based filtering** for enhanced security
6. **Maintain detailed logging** for forensic analysis

### Future Considerations

- **Enhanced monitoring tools** specifically designed for QUIC traffic
- **Standard security frameworks** for QUIC/HTTP3 implementation
- **Integration with existing security tools** and SIEM systems
- **Machine learning-based** anomaly detection for QUIC traffic

QUIC and HTTP/3 offer significant performance benefits, but successful deployment requires careful attention to their unique security implications. By implementing proper security controls and monitoring, organizations can safely adopt these next-generation protocols.

---

*Securing the future of web protocols - one packet at a time.*