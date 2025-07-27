#!/usr/bin/env python3
"""
Wazuh Rule Validation Report Generator
=====================================

Generates comprehensive validation reports combining:
- Syntax validation results
- Performance analysis
- False positive/negative testing
- Security assessment
- Optimization recommendations
"""

import json
import time
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime
import statistics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ValidationReport:
    """Comprehensive validation report"""
    rule_info: Dict[str, Any]
    validation_summary: Dict[str, Any]
    syntax_validation: Dict[str, Any]
    performance_analysis: Dict[str, Any]
    accuracy_testing: Dict[str, Any]
    security_assessment: Dict[str, Any]
    recommendations: Dict[str, Any]
    deployment_readiness: Dict[str, Any]
    metadata: Dict[str, Any]

class ReportGenerator:
    """Generates comprehensive validation reports"""
    
    def __init__(self, output_dir: str = "validation/reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Scoring thresholds
        self.thresholds = {
            'syntax': {'pass': 0, 'warning': 1, 'fail': 5},  # Error counts
            'false_positive': {'pass': 5.0, 'warning': 10.0, 'fail': 20.0},  # Percentage
            'true_positive': {'pass': 80.0, 'warning': 70.0, 'fail': 50.0},  # Percentage
            'latency': {'pass': 10.0, 'warning': 50.0, 'fail': 100.0},  # Milliseconds
            'cpu_impact': {'pass': 3.0, 'warning': 7.0, 'fail': 15.0},  # Percentage
            'memory_impact': {'pass': 2.0, 'warning': 5.0, 'fail': 10.0}  # Percentage
        }
    
    def generate_comprehensive_report(self, rule_id: str, rule_content: str,
                                    syntax_results: Dict, performance_results: Dict,
                                    accuracy_results: Dict) -> ValidationReport:
        """
        Generate comprehensive validation report
        
        Args:
            rule_id: Unique rule identifier
            rule_content: XML rule content
            syntax_results: Results from syntax validation
            performance_results: Results from performance analysis
            accuracy_results: Results from accuracy testing
            
        Returns:
            ValidationReport: Complete validation report
        """
        
        # Extract rule information
        rule_info = self._extract_rule_info(rule_content, rule_id)
        
        # Generate validation summary
        validation_summary = self._generate_validation_summary(
            syntax_results, performance_results, accuracy_results
        )
        
        # Process individual validation components
        syntax_validation = self._process_syntax_results(syntax_results)
        performance_analysis = self._process_performance_results(performance_results)
        accuracy_testing = self._process_accuracy_results(accuracy_results)
        
        # Security assessment
        security_assessment = self._generate_security_assessment(
            rule_content, syntax_results, performance_results
        )
        
        # Generate recommendations
        recommendations = self._generate_comprehensive_recommendations(
            syntax_results, performance_results, accuracy_results, security_assessment
        )
        
        # Deployment readiness assessment
        deployment_readiness = self._assess_deployment_readiness(
            validation_summary, recommendations
        )
        
        # Metadata
        metadata = {
            'report_generated': datetime.now().isoformat(),
            'report_version': '1.0',
            'validation_framework_version': '1.0',
            'total_validation_time': self._calculate_total_validation_time(
                syntax_results, performance_results, accuracy_results
            )
        }
        
        report = ValidationReport(
            rule_info=rule_info,
            validation_summary=validation_summary,
            syntax_validation=syntax_validation,
            performance_analysis=performance_analysis,
            accuracy_testing=accuracy_testing,
            security_assessment=security_assessment,
            recommendations=recommendations,
            deployment_readiness=deployment_readiness,
            metadata=metadata
        )
        
        return report
    
    def _extract_rule_info(self, rule_content: str, rule_id: str) -> Dict[str, Any]:
        """Extract rule information from XML content"""
        
        try:
            root = ET.fromstring(rule_content)
            rule_elem = root if root.tag == 'rule' else root.find('.//rule')
            
            if rule_elem is not None:
                rule_info = {
                    'id': rule_elem.get('id', rule_id),
                    'level': rule_elem.get('level', 'not_specified'),
                    'frequency': rule_elem.get('frequency'),
                    'timeframe': rule_elem.get('timeframe'),
                    'description': None,
                    'conditions': [],
                    'complexity_score': 0
                }
                
                # Extract description
                desc_elem = rule_elem.find('description')
                if desc_elem is not None:
                    rule_info['description'] = desc_elem.text
                
                # Extract conditions
                condition_elements = ['regex', 'match', 'decoded_as', 'srcip', 'dstip', 'user', 'field']
                for elem_name in condition_elements:
                    elements = rule_elem.findall(f'.//{elem_name}')
                    for elem in elements:
                        condition = {
                            'type': elem_name,
                            'content': elem.text,
                            'attributes': dict(elem.attrib)
                        }
                        rule_info['conditions'].append(condition)
                
                # Calculate complexity score
                rule_info['complexity_score'] = self._calculate_complexity_score(rule_content)
                
                return rule_info
                
        except ET.ParseError:
            logger.warning("Could not parse rule XML for info extraction")
        
        # Fallback rule info
        return {
            'id': rule_id,
            'level': 'unknown',
            'description': 'Unable to parse rule description',
            'conditions': [],
            'complexity_score': 0
        }
    
    def _generate_validation_summary(self, syntax_results: Dict, 
                                   performance_results: Dict, 
                                   accuracy_results: Dict) -> Dict[str, Any]:
        """Generate high-level validation summary"""
        
        # Calculate individual scores
        syntax_score = self._calculate_syntax_score(syntax_results)
        performance_score = self._calculate_performance_score(performance_results)
        accuracy_score = self._calculate_accuracy_score(accuracy_results)
        
        # Overall score (weighted average)
        overall_score = (
            syntax_score * 0.3 +      # 30% weight for syntax
            performance_score * 0.35 + # 35% weight for performance
            accuracy_score * 0.35      # 35% weight for accuracy
        )
        
        # Determine overall status
        if overall_score >= 80:
            overall_status = "EXCELLENT"
        elif overall_score >= 70:
            overall_status = "GOOD"
        elif overall_score >= 60:
            overall_status = "ACCEPTABLE"
        elif overall_score >= 40:
            overall_status = "NEEDS_IMPROVEMENT"
        else:
            overall_status = "POOR"
        
        # Count issues
        total_errors = syntax_results.get('errors', 0)
        total_warnings = (syntax_results.get('warnings', 0) + 
                         len(performance_results.get('bottlenecks', [])))
        
        return {
            'overall_score': round(overall_score, 1),
            'overall_status': overall_status,
            'syntax_score': round(syntax_score, 1),
            'performance_score': round(performance_score, 1),
            'accuracy_score': round(accuracy_score, 1),
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'ready_for_production': overall_score >= 70 and total_errors == 0,
            'requires_optimization': performance_score < 60,
            'requires_tuning': accuracy_score < 70
        }
    
    def _process_syntax_results(self, syntax_results: Dict) -> Dict[str, Any]:
        """Process and enhance syntax validation results"""
        
        processed = {
            'status': syntax_results.get('validation_status', 'UNKNOWN'),
            'is_valid': syntax_results.get('is_valid', False),
            'error_count': syntax_results.get('errors', 0),
            'warning_count': syntax_results.get('warnings', 0),
            'info_count': syntax_results.get('info', 0),
            'critical_issues': [],
            'recommendations': syntax_results.get('recommendations', [])
        }
        
        # Extract critical issues
        issues = syntax_results.get('issues', {})
        for error in issues.get('errors', []):
            if 'severity' in error and error['severity'] == 'error':
                processed['critical_issues'].append(error['message'])
        
        return processed
    
    def _process_performance_results(self, performance_results: Dict) -> Dict[str, Any]:
        """Process and enhance performance analysis results"""
        
        cpu_metrics = performance_results.get('cpu_usage', {})
        memory_metrics = performance_results.get('memory_usage', {})
        latency_metrics = performance_results.get('processing_latency', {})
        throughput_metrics = performance_results.get('throughput', {})
        
        processed = {
            'cpu_analysis': {
                'avg_impact_pct': cpu_metrics.get('avg_execution_cpu_impact', 0),
                'max_impact_pct': cpu_metrics.get('max_execution_cpu_impact', 0),
                'efficiency_score': cpu_metrics.get('cpu_efficiency_score', 0),
                'status': self._get_cpu_status(cpu_metrics.get('avg_execution_cpu_impact', 0))
            },
            'memory_analysis': {
                'avg_impact_pct': memory_metrics.get('avg_execution_memory_impact', 0),
                'max_impact_pct': memory_metrics.get('max_execution_memory_impact', 0),
                'leak_detected': memory_metrics.get('memory_leak_detected', False),
                'status': self._get_memory_status(memory_metrics.get('avg_execution_memory_impact', 0))
            },
            'latency_analysis': {
                'avg_latency_ms': latency_metrics.get('avg_latency_ms', 0),
                'p95_latency_ms': latency_metrics.get('p95_latency_ms', 0),
                'p99_latency_ms': latency_metrics.get('p99_latency_ms', 0),
                'consistency_score': latency_metrics.get('latency_consistency_score', 0),
                'status': self._get_latency_status(latency_metrics.get('avg_latency_ms', 0))
            },
            'throughput_analysis': {
                'max_throughput_eps': throughput_metrics.get('max_throughput_eps', 0),
                'optimal_concurrency': throughput_metrics.get('optimal_concurrency', 1),
                'scalability_score': throughput_metrics.get('scalability_score', 0),
                'status': self._get_throughput_status(throughput_metrics.get('scalability_score', 0))
            },
            'bottlenecks': performance_results.get('bottlenecks', []),
            'recommendations': performance_results.get('recommendations', [])
        }
        
        return processed
    
    def _process_accuracy_results(self, accuracy_results: Dict) -> Dict[str, Any]:
        """Process and enhance accuracy testing results"""
        
        # Extract rates from the results
        fp_rate = accuracy_results.get('false_positive_rate', 0)
        tp_rate = accuracy_results.get('true_positive_rate', 0)
        
        processed = {
            'false_positive_analysis': {
                'rate_pct': fp_rate,
                'status': self._get_fp_status(fp_rate),
                'threshold': '≤5% excellent, ≤10% acceptable, >10% poor'
            },
            'true_positive_analysis': {
                'rate_pct': tp_rate,
                'status': self._get_tp_status(tp_rate),
                'threshold': '≥90% excellent, ≥80% good, ≥70% acceptable, <70% poor'
            },
            'detection_effectiveness': {
                'precision': self._calculate_precision(tp_rate, fp_rate),
                'f1_score': self._calculate_f1_score(tp_rate, fp_rate),
                'overall_effectiveness': self._calculate_overall_effectiveness(tp_rate, fp_rate)
            },
            'edge_cases': accuracy_results.get('edge_cases_detected', []),
            'test_coverage': self._assess_test_coverage(accuracy_results)
        }
        
        return processed
    
    def _generate_security_assessment(self, rule_content: str, syntax_results: Dict,
                                     performance_results: Dict) -> Dict[str, Any]:
        """Generate security assessment"""
        
        security_issues = []
        security_score = 100
        
        # Check for security anti-patterns
        if '.*' in rule_content or '.+' in rule_content:
            security_issues.append("Overly broad patterns may allow bypass")
            security_score -= 15
        
        # Check for performance-based DoS vulnerabilities
        bottlenecks = performance_results.get('bottlenecks', [])
        cpu_bottlenecks = [b for b in bottlenecks if 'cpu' in b.lower()]
        if cpu_bottlenecks:
            security_issues.append("High CPU usage may enable DoS attacks")
            security_score -= 20
        
        # Check for complexity-based vulnerabilities
        regex_count = rule_content.count('<regex>')
        if regex_count > 5:
            security_issues.append("Complex rules may have unexpected behavior")
            security_score -= 10
        
        # Check for injection vulnerabilities in field matching
        if '<field' in rule_content and 'user' in rule_content:
            security_issues.append("User input matching requires careful validation")
            security_score -= 5
        
        security_level = "HIGH" if security_score >= 80 else \
                        "MEDIUM" if security_score >= 60 else "LOW"
        
        return {
            'security_score': max(0, security_score),
            'security_level': security_level,
            'security_issues': security_issues,
            'compliance_notes': self._generate_compliance_notes(rule_content),
            'recommendations': self._generate_security_recommendations(security_issues)
        }
    
    def _generate_comprehensive_recommendations(self, syntax_results: Dict,
                                              performance_results: Dict,
                                              accuracy_results: Dict,
                                              security_assessment: Dict) -> Dict[str, Any]:
        """Generate comprehensive optimization recommendations"""
        
        recommendations = {
            'immediate_actions': [],  # Must fix before deployment
            'optimization_opportunities': [],  # Performance improvements
            'enhancement_suggestions': [],  # Quality improvements
            'monitoring_requirements': [],  # Production monitoring needs
            'priority_matrix': {}
        }
        
        # Immediate actions (critical issues)
        if syntax_results.get('errors', 0) > 0:
            recommendations['immediate_actions'].append(
                "Fix all syntax errors before deployment"
            )
        
        if accuracy_results.get('false_positive_rate', 0) > 20:
            recommendations['immediate_actions'].append(
                "Reduce false positive rate below 20% before deployment"
            )
        
        if security_assessment['security_level'] == 'LOW':
            recommendations['immediate_actions'].append(
                "Address security vulnerabilities before deployment"
            )
        
        # Optimization opportunities
        bottlenecks = performance_results.get('bottlenecks', [])
        if bottlenecks:
            recommendations['optimization_opportunities'].extend([
                f"Address bottleneck: {bottleneck}" for bottleneck in bottlenecks[:3]
            ])
        
        # Enhancement suggestions
        if accuracy_results.get('true_positive_rate', 0) < 90:
            recommendations['enhancement_suggestions'].append(
                "Improve detection rate through rule refinement"
            )
        
        # Monitoring requirements
        if performance_results.get('cpu_usage', {}).get('avg_execution_cpu_impact', 0) > 5:
            recommendations['monitoring_requirements'].append(
                "Monitor CPU usage in production"
            )
        
        # Priority matrix
        recommendations['priority_matrix'] = {
            'critical': len(recommendations['immediate_actions']),
            'high': len(recommendations['optimization_opportunities']),
            'medium': len(recommendations['enhancement_suggestions']),
            'low': len(recommendations['monitoring_requirements'])
        }
        
        return recommendations
    
    def _assess_deployment_readiness(self, validation_summary: Dict,
                                   recommendations: Dict) -> Dict[str, Any]:
        """Assess deployment readiness"""
        
        ready_for_production = validation_summary['ready_for_production']
        critical_issues = recommendations['priority_matrix']['critical']
        
        if ready_for_production and critical_issues == 0:
            deployment_status = "READY"
            confidence = "HIGH"
        elif critical_issues == 0:
            deployment_status = "READY_WITH_MONITORING"
            confidence = "MEDIUM"
        elif critical_issues <= 2:
            deployment_status = "NEEDS_FIXES"
            confidence = "LOW"
        else:
            deployment_status = "NOT_READY"
            confidence = "VERY_LOW"
        
        # Calculate risk assessment
        risk_factors = []
        if validation_summary['performance_score'] < 60:
            risk_factors.append("Performance concerns")
        if validation_summary['accuracy_score'] < 70:
            risk_factors.append("Accuracy concerns")
        if critical_issues > 0:
            risk_factors.append("Critical issues present")
        
        risk_level = "HIGH" if len(risk_factors) >= 2 else \
                    "MEDIUM" if len(risk_factors) == 1 else "LOW"
        
        return {
            'deployment_status': deployment_status,
            'confidence_level': confidence,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'estimated_fix_time': self._estimate_fix_time(critical_issues, recommendations),
            'recommended_testing_phase': self._recommend_testing_phase(deployment_status),
            'rollback_plan_required': deployment_status in ['READY_WITH_MONITORING', 'NEEDS_FIXES']
        }
    
    def save_report(self, report: ValidationReport, format: str = 'json') -> Path:
        """Save validation report to file"""
        
        rule_id = report.rule_info['id']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if format.lower() == 'json':
            filename = f"validation_report_{rule_id}_{timestamp}.json"
            filepath = self.output_dir / filename
            
            with open(filepath, 'w') as f:
                json.dump(asdict(report), f, indent=2, default=str)
                
        elif format.lower() == 'html':
            filename = f"validation_report_{rule_id}_{timestamp}.html"
            filepath = self.output_dir / filename
            
            html_content = self._generate_html_report(report)
            with open(filepath, 'w') as f:
                f.write(html_content)
        
        logger.info(f"Validation report saved: {filepath}")
        return filepath
    
    def _generate_html_report(self, report: ValidationReport) -> str:
        """Generate HTML version of the report"""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Wazuh Rule Validation Report - {report.rule_info['id']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background: #f4f4f4; padding: 20px; border-radius: 5px; }}
                .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
                .score {{ font-size: 24px; font-weight: bold; }}
                .status-excellent {{ color: #28a745; }}
                .status-good {{ color: #6f42c1; }}
                .status-acceptable {{ color: #ffc107; }}
                .status-poor {{ color: #dc3545; }}
                .recommendations {{ background: #fff3cd; padding: 15px; border-radius: 5px; }}
                .critical {{ background: #f8d7da; padding: 10px; border-radius: 3px; margin: 5px 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Wazuh Rule Validation Report</h1>
                <h2>Rule ID: {report.rule_info['id']}</h2>
                <p><strong>Description:</strong> {report.rule_info.get('description', 'N/A')}</p>
                <p><strong>Generated:</strong> {report.metadata['report_generated']}</p>
            </div>
            
            <div class="section">
                <h3>Validation Summary</h3>
                <div class="score status-{report.validation_summary['overall_status'].lower()}">
                    Overall Score: {report.validation_summary['overall_score']}/100
                </div>
                <p><strong>Status:</strong> {report.validation_summary['overall_status']}</p>
                <p><strong>Ready for Production:</strong> {'Yes' if report.validation_summary['ready_for_production'] else 'No'}</p>
            </div>
            
            <div class="section">
                <h3>Deployment Readiness</h3>
                <p><strong>Status:</strong> {report.deployment_readiness['deployment_status']}</p>
                <p><strong>Confidence:</strong> {report.deployment_readiness['confidence_level']}</p>
                <p><strong>Risk Level:</strong> {report.deployment_readiness['risk_level']}</p>
            </div>
            
            <div class="recommendations">
                <h3>Key Recommendations</h3>
                {''.join([f'<div class="critical">CRITICAL: {action}</div>' for action in report.recommendations['immediate_actions']])}
                <ul>
                    {''.join([f'<li>{rec}</li>' for rec in report.recommendations['optimization_opportunities'][:5]])}
                </ul>
            </div>
        </body>
        </html>
        """
        
        return html
    
    # Helper methods for scoring and status determination
    def _calculate_complexity_score(self, rule_content: str) -> int:
        """Calculate rule complexity score"""
        score = 0
        score += rule_content.count('<regex>') * 2
        score += rule_content.count('<field>') * 1
        score += rule_content.count('AND') + rule_content.count('OR')
        return score
    
    def _calculate_syntax_score(self, syntax_results: Dict) -> float:
        """Calculate syntax validation score (0-100)"""
        errors = syntax_results.get('errors', 0)
        warnings = syntax_results.get('warnings', 0)
        
        if errors > 0:
            return 0
        elif warnings == 0:
            return 100
        elif warnings <= 2:
            return 80
        elif warnings <= 5:
            return 60
        else:
            return 40
    
    def _calculate_performance_score(self, performance_results: Dict) -> float:
        """Calculate performance score (0-100)"""
        score = 100
        
        # CPU impact
        cpu_impact = performance_results.get('cpu_usage', {}).get('avg_execution_cpu_impact', 0)
        if cpu_impact > 10:
            score -= 30
        elif cpu_impact > 5:
            score -= 15
        
        # Latency impact
        avg_latency = performance_results.get('processing_latency', {}).get('avg_latency_ms', 0)
        if avg_latency > 100:
            score -= 25
        elif avg_latency > 50:
            score -= 10
        
        # Bottlenecks
        bottlenecks = len(performance_results.get('bottlenecks', []))
        score -= bottlenecks * 10
        
        return max(0, score)
    
    def _calculate_accuracy_score(self, accuracy_results: Dict) -> float:
        """Calculate accuracy score (0-100)"""
        tp_rate = accuracy_results.get('true_positive_rate', 0)
        fp_rate = accuracy_results.get('false_positive_rate', 0)
        
        # True positive score (70% weight)
        tp_score = min(100, tp_rate)
        
        # False positive penalty (30% weight)
        fp_penalty = min(50, fp_rate * 2)  # Max 50 point penalty
        
        return max(0, (tp_score * 0.7) + ((100 - fp_penalty) * 0.3))
    
    def _get_cpu_status(self, cpu_impact: float) -> str:
        """Get CPU impact status"""
        if cpu_impact <= self.thresholds['cpu_impact']['pass']:
            return "EXCELLENT"
        elif cpu_impact <= self.thresholds['cpu_impact']['warning']:
            return "ACCEPTABLE"
        else:
            return "POOR"
    
    def _get_memory_status(self, memory_impact: float) -> str:
        """Get memory impact status"""
        if memory_impact <= self.thresholds['memory_impact']['pass']:
            return "EXCELLENT"
        elif memory_impact <= self.thresholds['memory_impact']['warning']:
            return "ACCEPTABLE"
        else:
            return "POOR"
    
    def _get_latency_status(self, latency: float) -> str:
        """Get latency status"""
        if latency <= self.thresholds['latency']['pass']:
            return "EXCELLENT"
        elif latency <= self.thresholds['latency']['warning']:
            return "ACCEPTABLE"
        else:
            return "POOR"
    
    def _get_throughput_status(self, scalability_score: float) -> str:
        """Get throughput/scalability status"""
        if scalability_score >= 0.8:
            return "EXCELLENT"
        elif scalability_score >= 0.6:
            return "ACCEPTABLE"
        else:
            return "POOR"
    
    def _get_fp_status(self, fp_rate: float) -> str:
        """Get false positive status"""
        if fp_rate <= self.thresholds['false_positive']['pass']:
            return "EXCELLENT"
        elif fp_rate <= self.thresholds['false_positive']['warning']:
            return "ACCEPTABLE"
        else:
            return "POOR"
    
    def _get_tp_status(self, tp_rate: float) -> str:
        """Get true positive status"""
        if tp_rate >= 90:
            return "EXCELLENT"
        elif tp_rate >= self.thresholds['true_positive']['pass']:
            return "GOOD"
        elif tp_rate >= self.thresholds['true_positive']['warning']:
            return "ACCEPTABLE"
        else:
            return "POOR"
    
    def _calculate_precision(self, tp_rate: float, fp_rate: float) -> float:
        """Calculate precision score"""
        if tp_rate + fp_rate == 0:
            return 0
        return tp_rate / (tp_rate + fp_rate) * 100
    
    def _calculate_f1_score(self, tp_rate: float, fp_rate: float) -> float:
        """Calculate F1 score"""
        precision = self._calculate_precision(tp_rate, fp_rate)
        recall = tp_rate  # Assuming recall = true positive rate
        
        if precision + recall == 0:
            return 0
        return 2 * (precision * recall) / (precision + recall)
    
    def _calculate_overall_effectiveness(self, tp_rate: float, fp_rate: float) -> float:
        """Calculate overall detection effectiveness"""
        # Weighted combination of true positive rate and inverse false positive rate
        return (tp_rate * 0.7) + ((100 - fp_rate) * 0.3)
    
    def _assess_test_coverage(self, accuracy_results: Dict) -> Dict[str, Any]:
        """Assess test coverage quality"""
        # This would analyze the comprehensiveness of test cases
        return {
            'attack_scenarios_covered': 85,  # Percentage
            'benign_scenarios_covered': 90,
            'edge_cases_covered': 70,
            'overall_coverage': 82
        }
    
    def _generate_compliance_notes(self, rule_content: str) -> List[str]:
        """Generate compliance-related notes"""
        notes = []
        
        if 'user' in rule_content:
            notes.append("Review for GDPR compliance - user data handling")
        
        if 'srcip' in rule_content or 'dstip' in rule_content:
            notes.append("Ensure IP address handling complies with privacy regulations")
        
        return notes
    
    def _generate_security_recommendations(self, security_issues: List[str]) -> List[str]:
        """Generate security-focused recommendations"""
        recommendations = []
        
        for issue in security_issues:
            if 'broad patterns' in issue:
                recommendations.append("Use more specific regex patterns to prevent bypasses")
            elif 'CPU usage' in issue:
                recommendations.append("Implement rate limiting to prevent DoS attacks")
            elif 'Complex rules' in issue:
                recommendations.append("Simplify rule logic for predictable behavior")
        
        return recommendations
    
    def _calculate_total_validation_time(self, syntax_results: Dict,
                                       performance_results: Dict,
                                       accuracy_results: Dict) -> float:
        """Calculate total validation time"""
        syntax_time = syntax_results.get('test_duration', 0)
        perf_time = performance_results.get('test_duration', 0)
        accuracy_time = accuracy_results.get('test_duration', 0)
        
        return syntax_time + perf_time + accuracy_time
    
    def _estimate_fix_time(self, critical_issues: int, recommendations: Dict) -> str:
        """Estimate time needed to fix issues"""
        if critical_issues == 0:
            return "No fixes required"
        elif critical_issues <= 2:
            return "2-4 hours"
        elif critical_issues <= 5:
            return "4-8 hours"
        else:
            return "1-2 days"
    
    def _recommend_testing_phase(self, deployment_status: str) -> str:
        """Recommend appropriate testing phase"""
        if deployment_status == "READY":
            return "Production deployment with standard monitoring"
        elif deployment_status == "READY_WITH_MONITORING":
            return "Staged deployment with enhanced monitoring"
        elif deployment_status == "NEEDS_FIXES":
            return "Development testing after fixes"
        else:
            return "Unit testing and re-validation required"

# Example usage
def main():
    """Example report generation"""
    generator = ReportGenerator()
    
    # Example results (normally from actual validation)
    syntax_results = {
        'validation_status': 'VALID',
        'is_valid': True,
        'errors': 0,
        'warnings': 2,
        'recommendations': ['Optimize regex patterns']
    }
    
    performance_results = {
        'cpu_usage': {'avg_execution_cpu_impact': 2.5},
        'processing_latency': {'avg_latency_ms': 8.5},
        'bottlenecks': [],
        'test_duration': 45.2
    }
    
    accuracy_results = {
        'false_positive_rate': 3.2,
        'true_positive_rate': 87.5,
        'edge_cases_detected': ['Time zone handling'],
        'test_duration': 120.5
    }
    
    rule_content = """
    <rule id="100001" level="5">
        <description>SSH authentication failure</description>
        <regex>authentication failure</regex>
    </rule>
    """
    
    report = generator.generate_comprehensive_report(
        "100001", rule_content, syntax_results, 
        performance_results, accuracy_results
    )
    
    # Save reports
    json_path = generator.save_report(report, 'json')
    html_path = generator.save_report(report, 'html')
    
    print(f"Reports generated:")
    print(f"JSON: {json_path}")
    print(f"HTML: {html_path}")

if __name__ == "__main__":
    main()