#!/usr/bin/env python3
"""
Main Wazuh Rule Validation Orchestrator
======================================

Orchestrates comprehensive validation of Wazuh correlation rules using:
- Syntax validation
- Performance analysis  
- Accuracy testing
- Security assessment
- Report generation
- Memory coordination with swarm
"""

import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
import sys
import os

# Add validation tools to path
sys.path.append(str(Path(__file__).parent))

from framework.validation_engine import RuleValidator
from tools.syntax_checker.wazuh_syntax_validator import WazuhSyntaxValidator
from tools.performance_monitor.performance_analyzer import PerformanceAnalyzer, LoadTestConfig
from tools.report_generator import ReportGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MainValidator:
    """Main validation orchestrator for Wazuh correlation rules"""
    
    def __init__(self, output_dir: str = "validation/reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize validation components
        self.rule_validator = RuleValidator()
        self.syntax_validator = WazuhSyntaxValidator()
        self.performance_analyzer = PerformanceAnalyzer()
        self.report_generator = ReportGenerator(str(self.output_dir))
        
        # Memory coordination for swarm
        self.memory_store = {}
        self.swarm_coordination_enabled = True
        
    async def validate_rule_comprehensive(self, rule_content: str, rule_metadata: Dict,
                                        load_config: Optional[LoadTestConfig] = None) -> Dict[str, Any]:
        """
        Comprehensive validation of a single rule with all validation components
        
        Args:
            rule_content: XML content of the Wazuh rule
            rule_metadata: Metadata about the rule (id, name, description, etc.)
            load_config: Optional load testing configuration
            
        Returns:
            Dict: Complete validation results
        """
        
        rule_id = rule_metadata.get('id', 'unknown')
        rule_name = rule_metadata.get('name', 'unknown')
        
        logger.info(f"Starting comprehensive validation for rule: {rule_name} ({rule_id})")
        start_time = time.time()
        
        # Store validation start in memory for swarm coordination
        await self._store_validation_progress(rule_id, {
            'status': 'in_progress',
            'started_at': time.time(),
            'rule_name': rule_name,
            'phase': 'initialization'
        })
        
        try:
            # Phase 1: Syntax Validation
            logger.info(f"Phase 1: Syntax validation for {rule_id}")
            await self._store_validation_progress(rule_id, {'phase': 'syntax_validation'})
            
            syntax_results = self.syntax_validator.validate_rule(rule_content)
            
            # Phase 2: Performance Analysis
            logger.info(f"Phase 2: Performance analysis for {rule_id}")
            await self._store_validation_progress(rule_id, {'phase': 'performance_analysis'})
            
            performance_results = await self.performance_analyzer.analyze_rule_performance(
                rule_content, rule_id, load_config
            )
            
            # Phase 3: Accuracy Testing
            logger.info(f"Phase 3: Accuracy testing for {rule_id}")
            await self._store_validation_progress(rule_id, {'phase': 'accuracy_testing'})
            
            accuracy_results = await self.rule_validator.validate_rule(rule_content, rule_metadata)
            
            # Phase 4: Report Generation
            logger.info(f"Phase 4: Report generation for {rule_id}")
            await self._store_validation_progress(rule_id, {'phase': 'report_generation'})
            
            # Convert performance results to dict for report generation
            performance_dict = {
                'cpu_usage': performance_results.cpu_usage,
                'memory_usage': performance_results.memory_usage,
                'processing_latency': performance_results.processing_latency,
                'throughput': performance_results.throughput,
                'resource_efficiency': performance_results.resource_efficiency,
                'bottlenecks': performance_results.bottlenecks,
                'recommendations': performance_results.recommendations,
                'test_duration': performance_results.test_duration
            }
            
            # Convert accuracy results to dict
            accuracy_dict = {
                'false_positive_rate': accuracy_results.false_positive_rate,
                'true_positive_rate': accuracy_results.true_positive_rate,
                'edge_cases_detected': accuracy_results.edge_cases_detected,
                'test_duration': accuracy_results.test_duration
            }
            
            # Generate comprehensive report
            validation_report = self.report_generator.generate_comprehensive_report(
                rule_id, rule_content, syntax_results, performance_dict, accuracy_dict
            )
            
            # Save reports in multiple formats
            json_path = self.report_generator.save_report(validation_report, 'json')
            html_path = self.report_generator.save_report(validation_report, 'html')
            
            validation_duration = time.time() - start_time
            
            # Compile final results
            final_results = {
                'rule_id': rule_id,
                'rule_name': rule_name,
                'validation_status': 'completed',
                'overall_score': validation_report.validation_summary['overall_score'],
                'overall_status': validation_report.validation_summary['overall_status'],
                'ready_for_production': validation_report.deployment_readiness['deployment_status'] == 'READY',
                'deployment_status': validation_report.deployment_readiness['deployment_status'],
                'validation_duration': validation_duration,
                'reports': {
                    'json_report': str(json_path),
                    'html_report': str(html_path)
                },
                'detailed_results': {
                    'syntax_validation': syntax_results,
                    'performance_analysis': performance_dict,
                    'accuracy_testing': accuracy_dict,
                    'validation_report': validation_report.__dict__
                },
                'key_metrics': {
                    'syntax_score': validation_report.validation_summary['syntax_score'],
                    'performance_score': validation_report.validation_summary['performance_score'],
                    'accuracy_score': validation_report.validation_summary['accuracy_score'],
                    'false_positive_rate': accuracy_results.false_positive_rate,
                    'true_positive_rate': accuracy_results.true_positive_rate,
                    'avg_latency_ms': performance_results.processing_latency.get('avg_latency_ms', 0),
                    'cpu_impact_pct': performance_results.cpu_usage.get('avg_execution_cpu_impact', 0),
                    'memory_impact_pct': performance_results.memory_usage.get('avg_execution_memory_impact', 0)
                },
                'recommendations': {
                    'immediate_actions': validation_report.recommendations['immediate_actions'],
                    'optimization_opportunities': validation_report.recommendations['optimization_opportunities'],
                    'priority_matrix': validation_report.recommendations['priority_matrix']
                }
            }
            
            # Store final results in memory for swarm coordination
            await self._store_validation_results(rule_id, final_results)
            
            logger.info(f"Validation completed for {rule_id} in {validation_duration:.2f}s")
            logger.info(f"Overall score: {final_results['overall_score']}/100 ({final_results['overall_status']})")
            
            return final_results
            
        except Exception as e:
            logger.error(f"Validation failed for {rule_id}: {str(e)}")
            
            error_results = {
                'rule_id': rule_id,
                'rule_name': rule_name,
                'validation_status': 'failed',
                'error': str(e),
                'validation_duration': time.time() - start_time
            }
            
            await self._store_validation_results(rule_id, error_results)
            return error_results
    
    async def validate_multiple_rules(self, rules: List[Dict[str, Any]], 
                                    concurrent: bool = True) -> Dict[str, Any]:
        """
        Validate multiple rules either concurrently or sequentially
        
        Args:
            rules: List of rule dictionaries with 'content' and 'metadata' keys
            concurrent: Whether to run validations in parallel
            
        Returns:
            Dict: Aggregated validation results
        """
        
        logger.info(f"Starting validation of {len(rules)} rules (concurrent={concurrent})")
        
        if concurrent:
            # Concurrent validation
            tasks = []
            for rule in rules:
                task = self.validate_rule_comprehensive(
                    rule['content'], rule['metadata']
                )
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            # Sequential validation
            results = []
            for rule in rules:
                result = await self.validate_rule_comprehensive(
                    rule['content'], rule['metadata']
                )
                results.append(result)
        
        # Aggregate results
        aggregated = self._aggregate_validation_results(results)
        
        # Store aggregated results in memory
        await self._store_batch_results(aggregated)
        
        return aggregated
    
    async def validate_from_memory(self, memory_pattern: str = "hive/rules/*") -> Dict[str, Any]:
        """
        Validate rules stored in swarm memory
        
        Args:
            memory_pattern: Pattern to search for rules in memory
            
        Returns:
            Dict: Validation results for all found rules
        """
        
        logger.info(f"Looking for rules in memory with pattern: {memory_pattern}")
        
        # This would integrate with actual memory system
        # For now, we'll simulate checking memory
        rules_from_memory = await self._retrieve_rules_from_memory(memory_pattern)
        
        if not rules_from_memory:
            logger.warning("No rules found in memory for validation")
            return {
                'status': 'no_rules_found',
                'message': 'No rules found in memory matching the pattern',
                'pattern': memory_pattern,
                'rules_validated': 0
            }
        
        logger.info(f"Found {len(rules_from_memory)} rules in memory for validation")
        
        # Validate all rules from memory
        return await self.validate_multiple_rules(rules_from_memory, concurrent=True)
    
    async def generate_swarm_validation_summary(self) -> Dict[str, Any]:
        """
        Generate summary of all validation activities for swarm coordination
        
        Returns:
            Dict: Comprehensive validation summary
        """
        
        all_results = await self._retrieve_all_validation_results()
        
        if not all_results:
            return {
                'status': 'no_validations_found',
                'message': 'No validation results found in memory'
            }
        
        # Calculate aggregate metrics
        total_rules = len(all_results)
        completed_validations = len([r for r in all_results if r.get('validation_status') == 'completed'])
        failed_validations = len([r for r in all_results if r.get('validation_status') == 'failed'])
        
        production_ready = len([r for r in all_results if r.get('ready_for_production', False)])
        
        # Calculate average scores
        completed_results = [r for r in all_results if r.get('validation_status') == 'completed']
        if completed_results:
            avg_overall_score = sum(r.get('overall_score', 0) for r in completed_results) / len(completed_results)
            avg_syntax_score = sum(r.get('key_metrics', {}).get('syntax_score', 0) for r in completed_results) / len(completed_results)
            avg_performance_score = sum(r.get('key_metrics', {}).get('performance_score', 0) for r in completed_results) / len(completed_results)
            avg_accuracy_score = sum(r.get('key_metrics', {}).get('accuracy_score', 0) for r in completed_results) / len(completed_results)
        else:
            avg_overall_score = avg_syntax_score = avg_performance_score = avg_accuracy_score = 0
        
        # Identify top issues
        all_immediate_actions = []
        for result in completed_results:
            all_immediate_actions.extend(result.get('recommendations', {}).get('immediate_actions', []))
        
        # Count issue frequency
        issue_frequency = {}
        for action in all_immediate_actions:
            issue_frequency[action] = issue_frequency.get(action, 0) + 1
        
        top_issues = sorted(issue_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
        
        summary = {
            'validation_summary': {
                'total_rules_processed': total_rules,
                'completed_validations': completed_validations,
                'failed_validations': failed_validations,
                'success_rate_pct': (completed_validations / total_rules * 100) if total_rules > 0 else 0,
                'production_ready_rules': production_ready,
                'production_readiness_pct': (production_ready / total_rules * 100) if total_rules > 0 else 0
            },
            'average_scores': {
                'overall_score': round(avg_overall_score, 1),
                'syntax_score': round(avg_syntax_score, 1),
                'performance_score': round(avg_performance_score, 1),
                'accuracy_score': round(avg_accuracy_score, 1)
            },
            'top_issues': [{'issue': issue, 'frequency': freq} for issue, freq in top_issues],
            'quality_distribution': self._calculate_quality_distribution(completed_results),
            'recommendations_for_swarm': self._generate_swarm_recommendations(completed_results),
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'memory_key': 'hive/validation/summary'
        }
        
        # Store summary in memory
        await self._store_validation_summary(summary)
        
        return summary
    
    def _aggregate_validation_results(self, results: List[Dict]) -> Dict[str, Any]:
        """Aggregate multiple validation results"""
        
        successful_results = [r for r in results if isinstance(r, dict) and r.get('validation_status') == 'completed']
        failed_results = [r for r in results if isinstance(r, dict) and r.get('validation_status') == 'failed']
        exception_results = [r for r in results if isinstance(r, Exception)]
        
        total_rules = len(results)
        successful_count = len(successful_results)
        
        aggregated = {
            'batch_validation_summary': {
                'total_rules': total_rules,
                'successful_validations': successful_count,
                'failed_validations': len(failed_results),
                'exceptions': len(exception_results),
                'success_rate_pct': (successful_count / total_rules * 100) if total_rules > 0 else 0
            },
            'individual_results': results,
            'aggregate_metrics': {},
            'batch_recommendations': [],
            'validation_completed_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        if successful_results:
            # Calculate aggregate metrics
            overall_scores = [r['overall_score'] for r in successful_results]
            aggregated['aggregate_metrics'] = {
                'avg_overall_score': sum(overall_scores) / len(overall_scores),
                'min_overall_score': min(overall_scores),
                'max_overall_score': max(overall_scores),
                'production_ready_count': len([r for r in successful_results if r['ready_for_production']]),
                'needs_optimization_count': len([r for r in successful_results if not r['ready_for_production']])
            }
            
            # Generate batch recommendations
            all_actions = []
            for result in successful_results:
                all_actions.extend(result.get('recommendations', {}).get('immediate_actions', []))
            
            action_frequency = {}
            for action in all_actions:
                action_frequency[action] = action_frequency.get(action, 0) + 1
            
            aggregated['batch_recommendations'] = [
                f"{action} (affects {freq} rules)" 
                for action, freq in sorted(action_frequency.items(), key=lambda x: x[1], reverse=True)
            ]
        
        return aggregated
    
    def _calculate_quality_distribution(self, results: List[Dict]) -> Dict[str, int]:
        """Calculate distribution of rule quality"""
        distribution = {'EXCELLENT': 0, 'GOOD': 0, 'ACCEPTABLE': 0, 'NEEDS_IMPROVEMENT': 0, 'POOR': 0}
        
        for result in results:
            status = result.get('overall_status', 'UNKNOWN')
            if status in distribution:
                distribution[status] += 1
        
        return distribution
    
    def _generate_swarm_recommendations(self, results: List[Dict]) -> List[str]:
        """Generate recommendations for the entire swarm"""
        recommendations = []
        
        if not results:
            return ["No validation results available for analysis"]
        
        # Calculate metrics
        production_ready_pct = len([r for r in results if r.get('ready_for_production', False)]) / len(results) * 100
        avg_score = sum(r.get('overall_score', 0) for r in results) / len(results)
        
        # Generate recommendations based on aggregate analysis
        if production_ready_pct < 50:
            recommendations.append("Less than 50% of rules are production-ready - review rule design process")
        
        if avg_score < 70:
            recommendations.append("Average rule quality is below target - implement rule quality guidelines")
        
        # Analyze common issues
        all_issues = []
        for result in results:
            all_issues.extend(result.get('recommendations', {}).get('immediate_actions', []))
        
        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
        
        frequent_issues = [issue for issue, count in issue_counts.items() if count > len(results) * 0.3]
        
        for issue in frequent_issues:
            recommendations.append(f"Common issue across rules: {issue}")
        
        return recommendations
    
    # Memory coordination methods (integrate with actual swarm memory system)
    async def _store_validation_progress(self, rule_id: str, progress_data: Dict):
        """Store validation progress in memory for swarm coordination"""
        if self.swarm_coordination_enabled:
            key = f"hive/validation/progress/{rule_id}"
            self.memory_store[key] = {
                **progress_data,
                'updated_at': time.time()
            }
            logger.debug(f"Stored validation progress for {rule_id}: {progress_data.get('phase', 'unknown')}")
    
    async def _store_validation_results(self, rule_id: str, results: Dict):
        """Store validation results in memory for swarm coordination"""
        if self.swarm_coordination_enabled:
            key = f"hive/validation/results/{rule_id}"
            self.memory_store[key] = {
                **results,
                'stored_at': time.time()
            }
            logger.info(f"Stored validation results for {rule_id} in memory")
    
    async def _store_batch_results(self, batch_results: Dict):
        """Store batch validation results"""
        if self.swarm_coordination_enabled:
            key = f"hive/validation/batch/{int(time.time())}"
            self.memory_store[key] = batch_results
            logger.info(f"Stored batch validation results in memory")
    
    async def _store_validation_summary(self, summary: Dict):
        """Store validation summary in memory"""
        if self.swarm_coordination_enabled:
            key = "hive/validation/summary"
            self.memory_store[key] = summary
            logger.info("Stored validation summary in memory")
    
    async def _retrieve_rules_from_memory(self, pattern: str) -> List[Dict]:
        """Retrieve rules from memory for validation"""
        # This would integrate with actual memory system
        # For simulation, return empty list
        logger.info(f"Searching memory for rules with pattern: {pattern}")
        return []
    
    async def _retrieve_all_validation_results(self) -> List[Dict]:
        """Retrieve all validation results from memory"""
        results = []
        for key, value in self.memory_store.items():
            if key.startswith("hive/validation/results/"):
                results.append(value)
        return results

# CLI interface for standalone usage
async def main():
    """Main CLI interface for validation"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Wazuh Rule Validation System")
    parser.add_argument('--rule-file', type=str, help="Path to rule XML file")
    parser.add_argument('--rule-id', type=str, help="Rule ID for validation")
    parser.add_argument('--memory-pattern', type=str, default="hive/rules/*", 
                       help="Memory pattern to search for rules")
    parser.add_argument('--output-dir', type=str, default="validation/reports",
                       help="Output directory for reports")
    parser.add_argument('--mode', type=str, choices=['single', 'memory', 'summary'], 
                       default='memory', help="Validation mode")
    
    args = parser.parse_args()
    
    validator = MainValidator(args.output_dir)
    
    if args.mode == 'single' and args.rule_file:
        # Validate single rule from file
        with open(args.rule_file, 'r') as f:
            rule_content = f.read()
        
        rule_metadata = {
            'id': args.rule_id or 'test_rule',
            'name': f'Rule from {args.rule_file}',
            'description': 'Rule loaded from file'
        }
        
        result = await validator.validate_rule_comprehensive(rule_content, rule_metadata)
        print(json.dumps(result, indent=2, default=str))
        
    elif args.mode == 'memory':
        # Validate rules from memory
        result = await validator.validate_from_memory(args.memory_pattern)
        print(json.dumps(result, indent=2, default=str))
        
    elif args.mode == 'summary':
        # Generate validation summary
        summary = await validator.generate_swarm_validation_summary()
        print(json.dumps(summary, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())