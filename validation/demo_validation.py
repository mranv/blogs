#!/usr/bin/env python3
"""
Wazuh Rule Validation Demo
=========================

Demonstrates the validation system with example rules and generates sample reports.
"""

import asyncio
import json
import logging
from pathlib import Path
import sys

# Add validation modules to path
sys.path.append(str(Path(__file__).parent))

from main_validator import MainValidator
from tools.performance_monitor.performance_analyzer import LoadTestConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Example Wazuh correlation rules for demonstration
DEMO_RULES = [
    {
        'content': '''
        <rule id="100001" level="5">
            <description>SSH authentication failure detection</description>
            <decoded_as>sshd</decoded_as>
            <regex>authentication failure</regex>
            <field name="srcip">.*</field>
            <field name="user">.*</field>
        </rule>
        ''',
        'metadata': {
            'id': '100001',
            'name': 'SSH Authentication Failure',
            'description': 'Detects failed SSH authentication attempts',
            'category': 'authentication',
            'severity': 'medium'
        }
    },
    {
        'content': '''
        <rule id="100002" level="10" frequency="5" timeframe="300">
            <description>SSH brute force attack detection</description>
            <if_sid>100001</if_sid>
            <same_srcip />
            <description>Multiple SSH authentication failures from same IP</description>
        </rule>
        ''',
        'metadata': {
            'id': '100002',
            'name': 'SSH Brute Force Detection',
            'description': 'Detects SSH brute force attacks (5+ failures in 5 minutes)',
            'category': 'attack_detection',
            'severity': 'high'
        }
    },
    {
        'content': '''
        <rule id="100003" level="12">
            <description>SQL injection attempt detection</description>
            <decoded_as>apache</decoded_as>
            <regex>SELECT.*FROM|UNION.*SELECT|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM</regex>
            <field name="url">.*</field>
            <field name="method">POST|GET</field>
        </rule>
        ''',
        'metadata': {
            'id': '100003',
            'name': 'SQL Injection Detection',
            'description': 'Detects SQL injection attempts in web requests',
            'category': 'web_attack',
            'severity': 'critical'
        }
    },
    {
        'content': '''
        <rule id="100004" level="7">
            <description>Suspicious file access pattern</description>
            <decoded_as>audit</decoded_as>
            <regex>/etc/passwd|/etc/shadow|/etc/hosts</regex>
            <field name="syscall">open|openat</field>
            <field name="success">yes</field>
        </rule>
        ''',
        'metadata': {
            'id': '100004',
            'name': 'Sensitive File Access',
            'description': 'Detects access to sensitive system files',
            'category': 'file_access',
            'severity': 'medium'
        }
    },
    {
        'content': '''
        <rule id="100005" level="15" frequency="10" timeframe="60">
            <description>Critical system alert - potential compromise</description>
            <if_group>attack_detection,web_attack</if_group>
            <description>Multiple attack patterns detected - possible system compromise</description>
        </rule>
        ''',
        'metadata': {
            'id': '100005',
            'name': 'System Compromise Alert',
            'description': 'High-level correlation rule for potential system compromise',
            'category': 'correlation',
            'severity': 'critical'
        }
    }
]

async def run_validation_demo():
    """Run comprehensive validation demo"""
    
    logger.info("=" * 60)
    logger.info("WAZUH RULE VALIDATION DEMO")
    logger.info("=" * 60)
    
    # Initialize validator
    validator = MainValidator("validation/demo_reports")
    
    # Demo 1: Single rule validation
    logger.info("\n🔍 DEMO 1: Single Rule Validation")
    logger.info("-" * 40)
    
    demo_rule = DEMO_RULES[0]  # SSH authentication failure
    
    load_config = LoadTestConfig(
        concurrent_users=5,
        events_per_second=50,
        test_duration=30
    )
    
    single_result = await validator.validate_rule_comprehensive(
        demo_rule['content'], 
        demo_rule['metadata'],
        load_config
    )
    
    logger.info(f"✅ Single rule validation completed")
    logger.info(f"   Rule: {single_result['rule_name']}")
    logger.info(f"   Score: {single_result['overall_score']}/100 ({single_result['overall_status']})")
    logger.info(f"   Production Ready: {single_result['ready_for_production']}")
    logger.info(f"   Duration: {single_result['validation_duration']:.2f}s")
    
    # Demo 2: Batch validation
    logger.info("\n🔍 DEMO 2: Batch Rule Validation")
    logger.info("-" * 40)
    
    batch_result = await validator.validate_multiple_rules(DEMO_RULES, concurrent=True)
    
    logger.info(f"✅ Batch validation completed")
    logger.info(f"   Total Rules: {batch_result['batch_validation_summary']['total_rules']}")
    logger.info(f"   Successful: {batch_result['batch_validation_summary']['successful_validations']}")
    logger.info(f"   Success Rate: {batch_result['batch_validation_summary']['success_rate_pct']:.1f}%")
    
    if 'aggregate_metrics' in batch_result:
        logger.info(f"   Average Score: {batch_result['aggregate_metrics']['avg_overall_score']:.1f}/100")
        logger.info(f"   Production Ready: {batch_result['aggregate_metrics']['production_ready_count']}")
    
    # Demo 3: Generate swarm summary
    logger.info("\n🔍 DEMO 3: Swarm Validation Summary")
    logger.info("-" * 40)
    
    summary = await validator.generate_swarm_validation_summary()
    
    if summary.get('status') != 'no_validations_found':
        logger.info(f"✅ Swarm summary generated")
        logger.info(f"   Rules Processed: {summary['validation_summary']['total_rules_processed']}")
        logger.info(f"   Production Ready: {summary['validation_summary']['production_readiness_pct']:.1f}%")
        logger.info(f"   Average Overall Score: {summary['average_scores']['overall_score']}")
        
        if summary['top_issues']:
            logger.info("   Top Issues:")
            for issue in summary['top_issues'][:3]:
                logger.info(f"     - {issue['issue']} (affects {issue['frequency']} rules)")
    else:
        logger.info("ℹ️  No previous validation results found in memory")
    
    # Demo 4: Show detailed results for one rule
    logger.info("\n📊 DEMO 4: Detailed Validation Results")
    logger.info("-" * 40)
    
    detailed_rule = batch_result['individual_results'][2]  # SQL injection rule
    if detailed_rule.get('validation_status') == 'completed':
        logger.info(f"Rule: {detailed_rule['rule_name']}")
        logger.info(f"Key Metrics:")
        metrics = detailed_rule['key_metrics']
        logger.info(f"  - Syntax Score: {metrics['syntax_score']}/100")
        logger.info(f"  - Performance Score: {metrics['performance_score']}/100")
        logger.info(f"  - Accuracy Score: {metrics['accuracy_score']}/100")
        logger.info(f"  - False Positive Rate: {metrics['false_positive_rate']:.2f}%")
        logger.info(f"  - True Positive Rate: {metrics['true_positive_rate']:.2f}%")
        logger.info(f"  - Average Latency: {metrics['avg_latency_ms']:.2f}ms")
        
        if detailed_rule['recommendations']['immediate_actions']:
            logger.info("Immediate Actions Required:")
            for action in detailed_rule['recommendations']['immediate_actions']:
                logger.info(f"  ⚠️  {action}")
        else:
            logger.info("✅ No immediate actions required")
    
    # Demo 5: Memory coordination demonstration
    logger.info("\n🧠 DEMO 5: Memory Coordination")
    logger.info("-" * 40)
    
    # Check validation framework status in memory
    memory_check = await validator._retrieve_all_validation_results()
    logger.info(f"✅ Memory coordination active")
    logger.info(f"   Stored Results: {len(memory_check)} validation records")
    logger.info(f"   Memory Keys: hive/validation/framework/ready, hive/validation/agent/status")
    
    # Demo 6: Performance analysis highlights
    logger.info("\n⚡ DEMO 6: Performance Analysis Highlights")
    logger.info("-" * 40)
    
    perf_results = []
    for result in batch_result['individual_results']:
        if result.get('validation_status') == 'completed':
            perf_results.append({
                'rule_name': result['rule_name'],
                'latency': result['key_metrics']['avg_latency_ms'],
                'cpu_impact': result['key_metrics']['cpu_impact_pct'],
                'memory_impact': result['key_metrics']['memory_impact_pct']
            })
    
    if perf_results:
        # Find best and worst performing rules
        best_latency = min(perf_results, key=lambda x: x['latency'])
        worst_latency = max(perf_results, key=lambda x: x['latency'])
        
        logger.info(f"Best Latency: {best_latency['rule_name']} ({best_latency['latency']:.2f}ms)")
        logger.info(f"Worst Latency: {worst_latency['rule_name']} ({worst_latency['latency']:.2f}ms)")
        
        avg_latency = sum(r['latency'] for r in perf_results) / len(perf_results)
        logger.info(f"Average Latency: {avg_latency:.2f}ms")
    
    # Demo 7: Security assessment
    logger.info("\n🔒 DEMO 7: Security Assessment Summary")
    logger.info("-" * 40)
    
    security_issues = []
    for result in batch_result['individual_results']:
        if result.get('validation_status') == 'completed':
            # Look for security-related recommendations
            for action in result['recommendations']['immediate_actions']:
                if any(word in action.lower() for word in ['security', 'vulnerability', 'attack', 'bypass']):
                    security_issues.append(f"{result['rule_name']}: {action}")
    
    if security_issues:
        logger.info("Security Issues Found:")
        for issue in security_issues:
            logger.info(f"  🔒 {issue}")
    else:
        logger.info("✅ No critical security issues detected")
    
    logger.info("\n" + "=" * 60)
    logger.info("VALIDATION DEMO COMPLETED")
    logger.info("=" * 60)
    logger.info("📁 Reports saved in: validation/demo_reports/")
    logger.info("🧠 Results stored in memory for swarm coordination")
    logger.info("📊 Ready to validate production rules from memory pattern: hive/rules/*")

if __name__ == "__main__":
    asyncio.run(run_validation_demo())