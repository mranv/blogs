#!/usr/bin/env python3
"""
Wazuh Correlation Rule Validation Engine
=========================================

Comprehensive validation framework for testing Wazuh correlation rules:
- False positive rate analysis
- Performance impact assessment
- Syntax validation
- Detection accuracy measurement
- Resource consumption monitoring
- Edge case identification
- Optimization recommendations
"""

import json
import time
import psutil
import logging
import asyncio
import subprocess
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ValidationMetrics:
    """Comprehensive validation metrics for a rule"""
    rule_id: str
    rule_name: str
    syntax_valid: bool
    false_positive_rate: float
    true_positive_rate: float
    performance_impact: Dict[str, float]
    resource_consumption: Dict[str, float]
    edge_cases_detected: List[str]
    optimization_suggestions: List[str]
    test_duration: float
    timestamp: str

@dataclass
class TestCase:
    """Individual test case for rule validation"""
    name: str
    input_data: Dict[str, Any]
    expected_result: bool
    severity: str
    scenario_type: str

class RuleValidator:
    """Main validation engine for Wazuh correlation rules"""
    
    def __init__(self, test_data_path: str = "validation/test-data"):
        self.test_data_path = Path(test_data_path)
        self.results = []
        self.baseline_metrics = {}
        
    async def validate_rule(self, rule_content: str, rule_metadata: Dict) -> ValidationMetrics:
        """
        Comprehensive validation of a single rule
        
        Args:
            rule_content: XML content of the Wazuh rule
            rule_metadata: Metadata about the rule (name, description, etc.)
            
        Returns:
            ValidationMetrics: Complete validation results
        """
        start_time = time.time()
        rule_id = rule_metadata.get('id', 'unknown')
        rule_name = rule_metadata.get('name', 'unknown')
        
        logger.info(f"Starting validation for rule: {rule_name} ({rule_id})")
        
        # Parallel validation tasks
        validation_tasks = [
            self._validate_syntax(rule_content),
            self._test_false_positives(rule_content, rule_metadata),
            self._test_true_positives(rule_content, rule_metadata),
            self._measure_performance_impact(rule_content),
            self._monitor_resource_consumption(rule_content),
            self._identify_edge_cases(rule_content, rule_metadata)
        ]
        
        results = await asyncio.gather(*validation_tasks)
        
        syntax_valid = results[0]
        fp_rate = results[1]
        tp_rate = results[2]
        perf_impact = results[3]
        resource_usage = results[4]
        edge_cases = results[5]
        
        # Generate optimization suggestions
        optimizations = self._generate_optimizations(
            syntax_valid, fp_rate, tp_rate, perf_impact, resource_usage, edge_cases
        )
        
        validation_time = time.time() - start_time
        
        metrics = ValidationMetrics(
            rule_id=rule_id,
            rule_name=rule_name,
            syntax_valid=syntax_valid,
            false_positive_rate=fp_rate,
            true_positive_rate=tp_rate,
            performance_impact=perf_impact,
            resource_consumption=resource_usage,
            edge_cases_detected=edge_cases,
            optimization_suggestions=optimizations,
            test_duration=validation_time,
            timestamp=time.strftime('%Y-%m-%d %H:%M:%S')
        )
        
        return metrics
    
    async def _validate_syntax(self, rule_content: str) -> bool:
        """Validate XML syntax and Wazuh rule structure"""
        try:
            # Parse XML
            root = ET.fromstring(rule_content)
            
            # Check required elements
            required_elements = ['rule', 'decoded_as', 'description']
            for element in required_elements:
                if not root.find(f".//{element}"):
                    logger.warning(f"Missing required element: {element}")
                    return False
            
            # Validate rule ID format
            rule_elem = root.find('.//rule')
            if rule_elem is not None:
                rule_id = rule_elem.get('id')
                if not rule_id or not rule_id.isdigit():
                    logger.warning("Invalid rule ID format")
                    return False
            
            return True
            
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            return False
        except Exception as e:
            logger.error(f"Syntax validation error: {e}")
            return False
    
    async def _test_false_positives(self, rule_content: str, metadata: Dict) -> float:
        """Test rule against known benign events to measure false positive rate"""
        
        # Load benign test cases
        benign_cases = self._load_test_cases("benign")
        
        if not benign_cases:
            logger.warning("No benign test cases found")
            return 0.0
        
        false_positives = 0
        total_tests = len(benign_cases)
        
        for test_case in benign_cases:
            # Simulate rule execution against benign event
            if await self._simulate_rule_match(rule_content, test_case.input_data):
                false_positives += 1
                logger.debug(f"False positive detected: {test_case.name}")
        
        fp_rate = (false_positives / total_tests) * 100 if total_tests > 0 else 0.0
        logger.info(f"False positive rate: {fp_rate:.2f}%")
        
        return fp_rate
    
    async def _test_true_positives(self, rule_content: str, metadata: Dict) -> float:
        """Test rule against known malicious events to measure detection accuracy"""
        
        # Load malicious test cases
        malicious_cases = self._load_test_cases("malicious")
        
        if not malicious_cases:
            logger.warning("No malicious test cases found")
            return 0.0
        
        true_positives = 0
        total_tests = len(malicious_cases)
        
        for test_case in malicious_cases:
            # Simulate rule execution against malicious event
            if await self._simulate_rule_match(rule_content, test_case.input_data):
                true_positives += 1
                logger.debug(f"True positive detected: {test_case.name}")
        
        tp_rate = (true_positives / total_tests) * 100 if total_tests > 0 else 0.0
        logger.info(f"True positive rate: {tp_rate:.2f}%")
        
        return tp_rate
    
    async def _measure_performance_impact(self, rule_content: str) -> Dict[str, float]:
        """Measure performance impact of the rule"""
        
        # Baseline measurement without rule
        baseline_cpu = await self._measure_cpu_usage(duration=5)
        baseline_memory = psutil.virtual_memory().percent
        
        # Measurement with rule active
        rule_cpu = await self._measure_cpu_usage_with_rule(rule_content, duration=5)
        rule_memory = psutil.virtual_memory().percent
        
        # Calculate processing time for rule evaluation
        processing_times = []
        for _ in range(100):  # Run 100 iterations
            start = time.perf_counter()
            await self._simulate_rule_evaluation(rule_content)
            end = time.perf_counter()
            processing_times.append((end - start) * 1000)  # Convert to milliseconds
        
        return {
            "cpu_impact_percent": rule_cpu - baseline_cpu,
            "memory_impact_percent": rule_memory - baseline_memory,
            "avg_processing_time_ms": statistics.mean(processing_times),
            "max_processing_time_ms": max(processing_times),
            "min_processing_time_ms": min(processing_times),
            "processing_time_std_ms": statistics.stdev(processing_times) if len(processing_times) > 1 else 0
        }
    
    async def _monitor_resource_consumption(self, rule_content: str) -> Dict[str, float]:
        """Monitor resource consumption during rule execution"""
        
        # Monitor for 30 seconds with rule active
        monitoring_duration = 30
        cpu_samples = []
        memory_samples = []
        
        start_time = time.time()
        while time.time() - start_time < monitoring_duration:
            cpu_samples.append(psutil.cpu_percent(interval=1))
            memory_samples.append(psutil.virtual_memory().percent)
            await asyncio.sleep(1)
        
        return {
            "avg_cpu_usage": statistics.mean(cpu_samples),
            "max_cpu_usage": max(cpu_samples),
            "avg_memory_usage": statistics.mean(memory_samples),
            "max_memory_usage": max(memory_samples),
            "cpu_variance": statistics.variance(cpu_samples) if len(cpu_samples) > 1 else 0,
            "memory_variance": statistics.variance(memory_samples) if len(memory_samples) > 1 else 0
        }
    
    async def _identify_edge_cases(self, rule_content: str, metadata: Dict) -> List[str]:
        """Identify potential edge cases that might cause issues"""
        
        edge_cases = []
        
        # Parse rule to identify potential issues
        try:
            root = ET.fromstring(rule_content)
            
            # Check for overly broad patterns
            if ".*" in rule_content:
                edge_cases.append("Contains overly broad regex patterns (.*)")
            
            # Check for multiple regex patterns
            regex_count = rule_content.count("<regex>")
            if regex_count > 3:
                edge_cases.append(f"Multiple regex patterns ({regex_count}) may impact performance")
            
            # Check for time-based conditions
            if "<time>" in rule_content:
                edge_cases.append("Time-based conditions require careful testing across timezones")
            
            # Check for field dependencies
            field_refs = root.findall(".//field")
            if len(field_refs) > 5:
                edge_cases.append("Many field references may cause issues with missing fields")
            
            # Check for complex boolean logic
            if rule_content.count("AND") + rule_content.count("OR") > 3:
                edge_cases.append("Complex boolean logic may be difficult to debug")
                
        except Exception as e:
            edge_cases.append(f"Rule parsing error: {str(e)}")
        
        return edge_cases
    
    def _generate_optimizations(self, syntax_valid: bool, fp_rate: float, 
                              tp_rate: float, perf_impact: Dict, 
                              resource_usage: Dict, edge_cases: List[str]) -> List[str]:
        """Generate optimization recommendations based on validation results"""
        
        optimizations = []
        
        # Syntax optimizations
        if not syntax_valid:
            optimizations.append("Fix syntax errors before deployment")
        
        # False positive optimizations
        if fp_rate > 5.0:  # More than 5% false positives
            optimizations.append("High false positive rate - consider adding more specific conditions")
            optimizations.append("Review and refine regex patterns to be more precise")
        
        # True positive optimizations
        if tp_rate < 80.0:  # Less than 80% detection rate
            optimizations.append("Low detection rate - consider broadening rule conditions")
            optimizations.append("Review test cases to ensure rule covers expected attack patterns")
        
        # Performance optimizations
        if perf_impact.get("avg_processing_time_ms", 0) > 10:
            optimizations.append("High processing time - optimize regex patterns")
            optimizations.append("Consider using more efficient field matching")
        
        if perf_impact.get("cpu_impact_percent", 0) > 5:
            optimizations.append("High CPU impact - review rule complexity")
        
        # Resource optimizations
        if resource_usage.get("max_memory_usage", 0) > 80:
            optimizations.append("High memory usage detected during testing")
        
        # Edge case optimizations
        if edge_cases:
            optimizations.append("Address identified edge cases before production deployment")
            for case in edge_cases[:3]:  # Limit to top 3 edge cases
                optimizations.append(f"Edge case: {case}")
        
        return optimizations
    
    def _load_test_cases(self, case_type: str) -> List[TestCase]:
        """Load test cases from files"""
        test_file = self.test_data_path / f"{case_type}_events.json"
        
        if not test_file.exists():
            logger.warning(f"Test case file not found: {test_file}")
            return []
        
        try:
            with open(test_file, 'r') as f:
                data = json.load(f)
            
            test_cases = []
            for case_data in data.get('test_cases', []):
                test_cases.append(TestCase(
                    name=case_data['name'],
                    input_data=case_data['input'],
                    expected_result=case_data['expected'],
                    severity=case_data.get('severity', 'medium'),
                    scenario_type=case_data.get('type', 'general')
                ))
            
            return test_cases
            
        except Exception as e:
            logger.error(f"Error loading test cases: {e}")
            return []
    
    async def _simulate_rule_match(self, rule_content: str, event_data: Dict) -> bool:
        """Simulate whether a rule would match against given event data"""
        # This is a simplified simulation
        # In practice, this would integrate with Wazuh's rule engine
        
        # Basic pattern matching simulation
        try:
            root = ET.fromstring(rule_content)
            
            # Check if event contains fields referenced in rule
            field_elements = root.findall(".//field")
            for field_elem in field_elements:
                field_name = field_elem.get('name', '')
                if field_name and field_name not in event_data:
                    return False
            
            # Simple regex pattern matching
            regex_elements = root.findall(".//regex")
            for regex_elem in regex_elements:
                pattern = regex_elem.text
                if pattern:
                    # Check if pattern matches any event field values
                    import re
                    for value in event_data.values():
                        if isinstance(value, str) and re.search(pattern, value):
                            return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error in rule simulation: {e}")
            return False
    
    async def _simulate_rule_evaluation(self, rule_content: str):
        """Simulate rule evaluation for performance testing"""
        # Simple simulation of rule parsing and evaluation
        try:
            root = ET.fromstring(rule_content)
            # Simulate some processing time
            await asyncio.sleep(0.001)  # 1ms simulation
        except:
            pass
    
    async def _measure_cpu_usage(self, duration: int) -> float:
        """Measure baseline CPU usage"""
        cpu_samples = []
        for _ in range(duration):
            cpu_samples.append(psutil.cpu_percent(interval=1))
        return statistics.mean(cpu_samples)
    
    async def _measure_cpu_usage_with_rule(self, rule_content: str, duration: int) -> float:
        """Measure CPU usage while simulating rule execution"""
        cpu_samples = []
        start_time = time.time()
        
        while time.time() - start_time < duration:
            cpu_start = psutil.cpu_percent()
            await self._simulate_rule_evaluation(rule_content)
            cpu_samples.append(psutil.cpu_percent())
            await asyncio.sleep(0.1)
        
        return statistics.mean(cpu_samples)
    
    def generate_report(self, metrics: ValidationMetrics) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        
        # Determine overall status
        status = "PASS"
        if not metrics.syntax_valid:
            status = "FAIL"
        elif metrics.false_positive_rate > 10 or metrics.true_positive_rate < 70:
            status = "WARNING"
        
        # Calculate performance score (0-100)
        perf_score = 100
        if metrics.performance_impact.get("avg_processing_time_ms", 0) > 5:
            perf_score -= 20
        if metrics.performance_impact.get("cpu_impact_percent", 0) > 3:
            perf_score -= 15
        if metrics.false_positive_rate > 5:
            perf_score -= 25
        if metrics.true_positive_rate < 80:
            perf_score -= 30
        
        perf_score = max(0, perf_score)
        
        report = {
            "rule_validation_report": {
                "rule_info": {
                    "id": metrics.rule_id,
                    "name": metrics.rule_name,
                    "validation_timestamp": metrics.timestamp
                },
                "overall_status": status,
                "performance_score": perf_score,
                "validation_results": {
                    "syntax_validation": {
                        "status": "PASS" if metrics.syntax_valid else "FAIL",
                        "valid": metrics.syntax_valid
                    },
                    "false_positive_analysis": {
                        "rate_percent": metrics.false_positive_rate,
                        "status": "PASS" if metrics.false_positive_rate <= 5 else "WARNING" if metrics.false_positive_rate <= 10 else "FAIL",
                        "threshold": "≤5% acceptable, ≤10% warning, >10% critical"
                    },
                    "detection_accuracy": {
                        "true_positive_rate": metrics.true_positive_rate,
                        "status": "PASS" if metrics.true_positive_rate >= 80 else "WARNING" if metrics.true_positive_rate >= 70 else "FAIL",
                        "threshold": "≥80% good, ≥70% acceptable, <70% poor"
                    },
                    "performance_impact": metrics.performance_impact,
                    "resource_consumption": metrics.resource_consumption,
                    "edge_cases": {
                        "count": len(metrics.edge_cases_detected),
                        "cases": metrics.edge_cases_detected
                    }
                },
                "recommendations": {
                    "optimizations": metrics.optimization_suggestions,
                    "deployment_readiness": status == "PASS",
                    "requires_tuning": len(metrics.optimization_suggestions) > 0
                },
                "test_metadata": {
                    "validation_duration_seconds": metrics.test_duration,
                    "test_timestamp": metrics.timestamp
                }
            }
        }
        
        return report

# Example usage and test runner
async def main():
    """Main validation runner"""
    validator = RuleValidator()
    
    # Example rule validation
    example_rule = """
    <rule id="100001" level="5">
        <decoded_as>sshd</decoded_as>
        <description>SSH authentication failure</description>
        <regex>authentication failure</regex>
        <field name="srcip">.*</field>
    </rule>
    """
    
    example_metadata = {
        "id": "100001",
        "name": "SSH Authentication Failure Detection",
        "description": "Detects failed SSH authentication attempts"
    }
    
    # Run validation
    metrics = await validator.validate_rule(example_rule, example_metadata)
    report = validator.generate_report(metrics)
    
    # Output results
    print("Validation Results:")
    print("=" * 50)
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    asyncio.run(main())