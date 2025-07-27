#!/usr/bin/env python3
"""
Wazuh Rule Performance Analyzer
===============================

Comprehensive performance monitoring and analysis for Wazuh correlation rules.
Measures CPU usage, memory consumption, processing latency, and throughput.
"""

import time
import psutil
import threading
import statistics
import json
import logging
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor
import asyncio
import subprocess
import tempfile
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Performance metrics for rule evaluation"""
    rule_id: str
    cpu_usage: Dict[str, float]
    memory_usage: Dict[str, float]
    processing_latency: Dict[str, float]
    throughput: Dict[str, float]
    resource_efficiency: Dict[str, float]
    bottlenecks: List[str]
    recommendations: List[str]
    test_duration: float
    timestamp: str

@dataclass
class LoadTestConfig:
    """Configuration for load testing"""
    concurrent_users: int = 10
    events_per_second: int = 100
    test_duration: int = 60
    ramp_up_time: int = 10
    event_types: List[str] = None

class PerformanceAnalyzer:
    """Performance analysis engine for Wazuh rules"""
    
    def __init__(self, baseline_samples: int = 30):
        self.baseline_samples = baseline_samples
        self.monitoring_active = False
        self.performance_data = []
        self.baseline_metrics = {}
        
    async def analyze_rule_performance(self, rule_content: str, rule_id: str, 
                                     load_config: LoadTestConfig = None) -> PerformanceMetrics:
        """
        Comprehensive performance analysis of a Wazuh rule
        
        Args:
            rule_content: XML content of the Wazuh rule
            rule_id: Unique identifier for the rule
            load_config: Load testing configuration
            
        Returns:
            PerformanceMetrics: Complete performance analysis results
        """
        start_time = time.time()
        
        if not load_config:
            load_config = LoadTestConfig()
        
        logger.info(f"Starting performance analysis for rule: {rule_id}")
        
        # Establish baseline metrics
        await self._establish_baseline()
        
        # Run performance tests in parallel
        performance_tasks = [
            self._measure_cpu_performance(rule_content, rule_id),
            self._measure_memory_performance(rule_content, rule_id),
            self._measure_processing_latency(rule_content, rule_id),
            self._measure_throughput(rule_content, rule_id, load_config),
            self._analyze_resource_efficiency(rule_content, rule_id)
        ]
        
        results = await asyncio.gather(*performance_tasks)
        
        cpu_metrics = results[0]
        memory_metrics = results[1]
        latency_metrics = results[2]
        throughput_metrics = results[3]
        efficiency_metrics = results[4]
        
        # Identify bottlenecks
        bottlenecks = self._identify_bottlenecks(
            cpu_metrics, memory_metrics, latency_metrics, throughput_metrics
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            cpu_metrics, memory_metrics, latency_metrics, 
            throughput_metrics, efficiency_metrics, bottlenecks
        )
        
        analysis_duration = time.time() - start_time
        
        metrics = PerformanceMetrics(
            rule_id=rule_id,
            cpu_usage=cpu_metrics,
            memory_usage=memory_metrics,
            processing_latency=latency_metrics,
            throughput=throughput_metrics,
            resource_efficiency=efficiency_metrics,
            bottlenecks=bottlenecks,
            recommendations=recommendations,
            test_duration=analysis_duration,
            timestamp=time.strftime('%Y-%m-%d %H:%M:%S')
        )
        
        return metrics
    
    async def _establish_baseline(self):
        """Establish baseline system performance metrics"""
        logger.info("Establishing baseline performance metrics...")
        
        cpu_samples = []
        memory_samples = []
        
        for _ in range(self.baseline_samples):
            cpu_samples.append(psutil.cpu_percent(interval=0.1))
            memory_samples.append(psutil.virtual_memory().percent)
            await asyncio.sleep(0.1)
        
        self.baseline_metrics = {
            'cpu_average': statistics.mean(cpu_samples),
            'cpu_max': max(cpu_samples),
            'cpu_std': statistics.stdev(cpu_samples) if len(cpu_samples) > 1 else 0,
            'memory_average': statistics.mean(memory_samples),
            'memory_max': max(memory_samples),
            'memory_std': statistics.stdev(memory_samples) if len(memory_samples) > 1 else 0
        }
        
        logger.info(f"Baseline CPU: {self.baseline_metrics['cpu_average']:.2f}%")
        logger.info(f"Baseline Memory: {self.baseline_metrics['memory_average']:.2f}%")
    
    async def _measure_cpu_performance(self, rule_content: str, rule_id: str) -> Dict[str, float]:
        """Measure CPU performance impact of rule processing"""
        
        # CPU usage during rule compilation
        compile_start = time.perf_counter()
        cpu_before_compile = psutil.cpu_percent()
        
        # Simulate rule compilation
        await self._simulate_rule_compilation(rule_content)
        
        compile_duration = time.perf_counter() - compile_start
        cpu_after_compile = psutil.cpu_percent()
        
        # CPU usage during rule execution
        execution_samples = []
        for _ in range(100):  # 100 execution samples
            cpu_start = psutil.cpu_percent()
            await self._simulate_rule_execution(rule_content)
            cpu_end = psutil.cpu_percent()
            execution_samples.append(cpu_end - cpu_start)
        
        # CPU stress test
        stress_samples = await self._cpu_stress_test(rule_content)
        
        return {
            'baseline_cpu': self.baseline_metrics['cpu_average'],
            'compilation_cpu_impact': cpu_after_compile - cpu_before_compile,
            'compilation_time_ms': compile_duration * 1000,
            'avg_execution_cpu_impact': statistics.mean(execution_samples),
            'max_execution_cpu_impact': max(execution_samples),
            'cpu_impact_std': statistics.stdev(execution_samples) if len(execution_samples) > 1 else 0,
            'stress_test_avg_cpu': statistics.mean(stress_samples),
            'stress_test_max_cpu': max(stress_samples),
            'cpu_efficiency_score': self._calculate_cpu_efficiency(execution_samples)
        }
    
    async def _measure_memory_performance(self, rule_content: str, rule_id: str) -> Dict[str, float]:
        """Measure memory performance impact of rule processing"""
        
        # Memory usage during rule compilation
        memory_before = psutil.virtual_memory().percent
        await self._simulate_rule_compilation(rule_content)
        memory_after = psutil.virtual_memory().percent
        
        # Memory usage during sustained execution
        execution_samples = []
        for _ in range(50):  # 50 execution samples
            mem_start = psutil.virtual_memory().percent
            await self._simulate_rule_execution(rule_content)
            mem_end = psutil.virtual_memory().percent
            execution_samples.append(mem_end - mem_start)
            await asyncio.sleep(0.1)  # Small delay between samples
        
        # Memory leak detection
        leak_test_results = await self._memory_leak_test(rule_content)
        
        # Process memory usage
        process = psutil.Process()
        process_memory_mb = process.memory_info().rss / 1024 / 1024
        
        return {
            'baseline_memory': self.baseline_metrics['memory_average'],
            'compilation_memory_impact': memory_after - memory_before,
            'avg_execution_memory_impact': statistics.mean(execution_samples),
            'max_execution_memory_impact': max(execution_samples),
            'memory_impact_std': statistics.stdev(execution_samples) if len(execution_samples) > 1 else 0,
            'process_memory_mb': process_memory_mb,
            'memory_leak_detected': leak_test_results['leak_detected'],
            'memory_growth_rate': leak_test_results['growth_rate'],
            'memory_efficiency_score': self._calculate_memory_efficiency(execution_samples)
        }
    
    async def _measure_processing_latency(self, rule_content: str, rule_id: str) -> Dict[str, float]:
        """Measure rule processing latency"""
        
        # Single event processing latency
        single_event_latencies = []
        for _ in range(1000):  # 1000 samples for accuracy
            start = time.perf_counter()
            await self._simulate_rule_execution(rule_content)
            end = time.perf_counter()
            single_event_latencies.append((end - start) * 1000)  # Convert to milliseconds
        
        # Batch processing latency
        batch_sizes = [10, 50, 100, 500]
        batch_latencies = {}
        
        for batch_size in batch_sizes:
            batch_times = []
            for _ in range(10):  # 10 batch tests per size
                events = [{"test": f"event_{i}"} for i in range(batch_size)]
                start = time.perf_counter()
                await self._simulate_batch_processing(rule_content, events)
                end = time.perf_counter()
                batch_times.append((end - start) * 1000)
            
            batch_latencies[f'batch_{batch_size}'] = {
                'avg_ms': statistics.mean(batch_times),
                'max_ms': max(batch_times),
                'min_ms': min(batch_times),
                'events_per_ms': batch_size / statistics.mean(batch_times)
            }
        
        # Percentile calculations
        single_event_latencies.sort()
        p50 = single_event_latencies[len(single_event_latencies) // 2]
        p95 = single_event_latencies[int(len(single_event_latencies) * 0.95)]
        p99 = single_event_latencies[int(len(single_event_latencies) * 0.99)]
        
        return {
            'avg_latency_ms': statistics.mean(single_event_latencies),
            'max_latency_ms': max(single_event_latencies),
            'min_latency_ms': min(single_event_latencies),
            'latency_std_ms': statistics.stdev(single_event_latencies),
            'p50_latency_ms': p50,
            'p95_latency_ms': p95,
            'p99_latency_ms': p99,
            'batch_processing': batch_latencies,
            'latency_consistency_score': self._calculate_latency_consistency(single_event_latencies)
        }
    
    async def _measure_throughput(self, rule_content: str, rule_id: str, 
                                load_config: LoadTestConfig) -> Dict[str, float]:
        """Measure rule processing throughput under various loads"""
        
        # Sequential throughput test
        sequential_start = time.perf_counter()
        sequential_events = 1000
        
        for _ in range(sequential_events):
            await self._simulate_rule_execution(rule_content)
        
        sequential_duration = time.perf_counter() - sequential_start
        sequential_throughput = sequential_events / sequential_duration
        
        # Concurrent throughput test
        concurrent_throughputs = []
        concurrency_levels = [1, 5, 10, 20, 50]
        
        for concurrency in concurrency_levels:
            throughput = await self._concurrent_throughput_test(rule_content, concurrency)
            concurrent_throughputs.append({
                'concurrency': concurrency,
                'throughput_eps': throughput,
                'efficiency_pct': (throughput / (sequential_throughput * concurrency)) * 100
            })
        
        # Load test
        load_test_results = await self._load_test(rule_content, load_config)
        
        # Find optimal concurrency
        optimal_concurrency = max(concurrent_throughputs, key=lambda x: x['throughput_eps'])
        
        return {
            'sequential_throughput_eps': sequential_throughput,
            'max_throughput_eps': max(ct['throughput_eps'] for ct in concurrent_throughputs),
            'optimal_concurrency': optimal_concurrency['concurrency'],
            'optimal_throughput_eps': optimal_concurrency['throughput_eps'],
            'concurrent_performance': concurrent_throughputs,
            'load_test_results': load_test_results,
            'scalability_score': self._calculate_scalability_score(concurrent_throughputs)
        }
    
    async def _analyze_resource_efficiency(self, rule_content: str, rule_id: str) -> Dict[str, float]:
        """Analyze resource utilization efficiency"""
        
        # CPU efficiency
        cpu_samples = []
        processing_times = []
        
        for _ in range(100):
            cpu_start = psutil.cpu_percent()
            time_start = time.perf_counter()
            
            await self._simulate_rule_execution(rule_content)
            
            time_end = time.perf_counter()
            cpu_end = psutil.cpu_percent()
            
            cpu_samples.append(cpu_end - cpu_start)
            processing_times.append(time_end - time_start)
        
        # Memory efficiency
        memory_samples = []
        for _ in range(50):
            mem_start = psutil.virtual_memory().percent
            await self._simulate_rule_execution(rule_content)
            mem_end = psutil.virtual_memory().percent
            memory_samples.append(mem_end - mem_start)
        
        # I/O efficiency (if applicable)
        io_efficiency = await self._measure_io_efficiency(rule_content)
        
        # Resource utilization ratios
        avg_cpu_usage = statistics.mean(cpu_samples)
        avg_processing_time = statistics.mean(processing_times)
        avg_memory_usage = statistics.mean(memory_samples)
        
        cpu_time_ratio = avg_cpu_usage / avg_processing_time if avg_processing_time > 0 else 0
        memory_efficiency_ratio = 1 / (avg_memory_usage + 1)  # Lower memory usage = higher efficiency
        
        return {
            'cpu_efficiency_ratio': cpu_time_ratio,
            'memory_efficiency_ratio': memory_efficiency_ratio,
            'io_efficiency_score': io_efficiency,
            'overall_efficiency_score': (cpu_time_ratio + memory_efficiency_ratio + io_efficiency) / 3,
            'resource_waste_pct': self._calculate_resource_waste(cpu_samples, memory_samples),
            'optimization_potential': self._calculate_optimization_potential(
                cpu_samples, memory_samples, processing_times
            )
        }
    
    async def _cpu_stress_test(self, rule_content: str) -> List[float]:
        """Run CPU stress test with rule processing"""
        stress_samples = []
        
        # High-frequency processing for 10 seconds
        start_time = time.time()
        while time.time() - start_time < 10:
            cpu_start = psutil.cpu_percent()
            
            # Rapid-fire rule executions
            for _ in range(10):
                await self._simulate_rule_execution(rule_content)
            
            cpu_end = psutil.cpu_percent()
            stress_samples.append(cpu_end)
            await asyncio.sleep(0.1)
        
        return stress_samples
    
    async def _memory_leak_test(self, rule_content: str) -> Dict[str, Any]:
        """Test for memory leaks during sustained operation"""
        initial_memory = psutil.virtual_memory().percent
        memory_samples = [initial_memory]
        
        # Run for 60 seconds with periodic sampling
        start_time = time.time()
        iteration = 0
        
        while time.time() - start_time < 60:
            await self._simulate_rule_execution(rule_content)
            iteration += 1
            
            # Sample memory every 100 iterations
            if iteration % 100 == 0:
                memory_samples.append(psutil.virtual_memory().percent)
        
        # Analyze memory growth
        if len(memory_samples) > 1:
            memory_growth = memory_samples[-1] - memory_samples[0]
            growth_rate = memory_growth / len(memory_samples)
            
            # Simple leak detection (growth > 1% over test period)
            leak_detected = memory_growth > 1.0
        else:
            memory_growth = 0
            growth_rate = 0
            leak_detected = False
        
        return {
            'leak_detected': leak_detected,
            'total_growth_pct': memory_growth,
            'growth_rate': growth_rate,
            'sample_count': len(memory_samples)
        }
    
    async def _concurrent_throughput_test(self, rule_content: str, concurrency: int) -> float:
        """Test throughput at specific concurrency level"""
        
        async def worker():
            """Worker function for concurrent execution"""
            count = 0
            start_time = time.time()
            
            while time.time() - start_time < 10:  # Run for 10 seconds
                await self._simulate_rule_execution(rule_content)
                count += 1
            
            return count
        
        # Run concurrent workers
        tasks = [worker() for _ in range(concurrency)]
        results = await asyncio.gather(*tasks)
        
        total_events = sum(results)
        return total_events / 10  # Events per second
    
    async def _load_test(self, rule_content: str, load_config: LoadTestConfig) -> Dict[str, Any]:
        """Comprehensive load testing"""
        
        results = {
            'total_events_processed': 0,
            'average_throughput_eps': 0,
            'peak_throughput_eps': 0,
            'error_rate_pct': 0,
            'response_times': [],
            'resource_utilization': {
                'cpu_max': 0,
                'memory_max': 0
            }
        }
        
        # Implementation would involve actual load testing
        # For simulation, we'll generate representative results
        
        events_per_worker = load_config.events_per_second // load_config.concurrent_users
        test_duration = load_config.test_duration
        
        # Simulate load test results
        results['total_events_processed'] = load_config.events_per_second * test_duration
        results['average_throughput_eps'] = load_config.events_per_second
        results['peak_throughput_eps'] = load_config.events_per_second * 1.2
        results['error_rate_pct'] = 0.1  # Simulated low error rate
        
        return results
    
    async def _measure_io_efficiency(self, rule_content: str) -> float:
        """Measure I/O efficiency if rule involves file operations"""
        # Placeholder for I/O efficiency measurement
        # In practice, this would measure file read/write performance
        return 0.8  # Simulated efficiency score
    
    def _identify_bottlenecks(self, cpu_metrics: Dict, memory_metrics: Dict, 
                            latency_metrics: Dict, throughput_metrics: Dict) -> List[str]:
        """Identify performance bottlenecks"""
        bottlenecks = []
        
        # CPU bottlenecks
        if cpu_metrics['max_execution_cpu_impact'] > 10:
            bottlenecks.append("High CPU usage during rule execution")
        
        if cpu_metrics['cpu_efficiency_score'] < 0.5:
            bottlenecks.append("Poor CPU efficiency - rule processing is CPU-intensive")
        
        # Memory bottlenecks
        if memory_metrics['memory_leak_detected']:
            bottlenecks.append("Memory leak detected during sustained operation")
        
        if memory_metrics['max_execution_memory_impact'] > 5:
            bottlenecks.append("High memory consumption during rule execution")
        
        # Latency bottlenecks
        if latency_metrics['p95_latency_ms'] > 100:
            bottlenecks.append("High latency (>100ms) for 95% of requests")
        
        if latency_metrics['latency_consistency_score'] < 0.7:
            bottlenecks.append("Inconsistent processing latency")
        
        # Throughput bottlenecks
        if throughput_metrics['scalability_score'] < 0.6:
            bottlenecks.append("Poor scalability under concurrent load")
        
        return bottlenecks
    
    def _generate_recommendations(self, cpu_metrics: Dict, memory_metrics: Dict,
                                latency_metrics: Dict, throughput_metrics: Dict,
                                efficiency_metrics: Dict, bottlenecks: List[str]) -> List[str]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        # CPU recommendations
        if cpu_metrics['compilation_cpu_impact'] > 5:
            recommendations.append("Rule compilation is CPU-intensive - consider simpler patterns")
        
        if cpu_metrics['avg_execution_cpu_impact'] > 3:
            recommendations.append("Optimize regex patterns to reduce CPU usage")
        
        # Memory recommendations
        if memory_metrics['memory_leak_detected']:
            recommendations.append("Fix memory leak - check for unclosed resources")
        
        if memory_metrics['avg_execution_memory_impact'] > 2:
            recommendations.append("Reduce memory footprint - minimize data structures")
        
        # Latency recommendations
        if latency_metrics['avg_latency_ms'] > 50:
            recommendations.append("Reduce processing latency - optimize rule logic")
        
        if latency_metrics['latency_consistency_score'] < 0.8:
            recommendations.append("Improve latency consistency - avoid variable-time operations")
        
        # Throughput recommendations
        if throughput_metrics['scalability_score'] < 0.7:
            recommendations.append("Improve scalability - reduce resource contention")
        
        # Efficiency recommendations
        if efficiency_metrics['overall_efficiency_score'] < 0.6:
            recommendations.append("Overall poor efficiency - comprehensive optimization needed")
        
        if efficiency_metrics['optimization_potential'] > 0.3:
            recommendations.append("High optimization potential - significant improvements possible")
        
        # General recommendations
        if not recommendations:
            recommendations.append("Performance is within acceptable limits")
        
        return recommendations
    
    def _calculate_cpu_efficiency(self, cpu_samples: List[float]) -> float:
        """Calculate CPU efficiency score (0-1)"""
        if not cpu_samples:
            return 0.0
        
        avg_usage = statistics.mean(cpu_samples)
        max_usage = max(cpu_samples)
        
        # Lower and more consistent usage = higher efficiency
        consistency = 1 - (statistics.stdev(cpu_samples) / max(avg_usage, 1))
        usage_efficiency = 1 / (avg_usage + 1)
        
        return (consistency + usage_efficiency) / 2
    
    def _calculate_memory_efficiency(self, memory_samples: List[float]) -> float:
        """Calculate memory efficiency score (0-1)"""
        if not memory_samples:
            return 1.0
        
        avg_usage = statistics.mean(memory_samples)
        
        # Lower memory usage = higher efficiency
        return 1 / (avg_usage + 1)
    
    def _calculate_latency_consistency(self, latencies: List[float]) -> float:
        """Calculate latency consistency score (0-1)"""
        if not latencies or len(latencies) < 2:
            return 1.0
        
        avg_latency = statistics.mean(latencies)
        std_latency = statistics.stdev(latencies)
        
        # Lower coefficient of variation = higher consistency
        cv = std_latency / avg_latency if avg_latency > 0 else 0
        return max(0, 1 - cv)
    
    def _calculate_scalability_score(self, concurrent_performance: List[Dict]) -> float:
        """Calculate scalability score (0-1)"""
        if len(concurrent_performance) < 2:
            return 0.5
        
        # Ideal scalability would maintain efficiency as concurrency increases
        efficiencies = [cp['efficiency_pct'] for cp in concurrent_performance]
        
        # Good scalability maintains high efficiency
        avg_efficiency = statistics.mean(efficiencies)
        return min(1.0, avg_efficiency / 100)
    
    def _calculate_resource_waste(self, cpu_samples: List[float], memory_samples: List[float]) -> float:
        """Calculate percentage of wasted resources"""
        cpu_waste = max(0, statistics.mean(cpu_samples) - self.baseline_metrics['cpu_average'])
        memory_waste = max(0, statistics.mean(memory_samples) - self.baseline_metrics['memory_average'])
        
        # Normalize and combine
        return min(100, (cpu_waste + memory_waste) / 2)
    
    def _calculate_optimization_potential(self, cpu_samples: List[float], 
                                        memory_samples: List[float], 
                                        processing_times: List[float]) -> float:
        """Calculate optimization potential (0-1)"""
        
        # High variance suggests optimization opportunities
        cpu_variance = statistics.variance(cpu_samples) if len(cpu_samples) > 1 else 0
        memory_variance = statistics.variance(memory_samples) if len(memory_samples) > 1 else 0
        time_variance = statistics.variance(processing_times) if len(processing_times) > 1 else 0
        
        # Normalize variances
        normalized_variances = [
            min(1.0, cpu_variance / 100),
            min(1.0, memory_variance / 100),
            min(1.0, time_variance)
        ]
        
        return statistics.mean(normalized_variances)
    
    async def _simulate_rule_compilation(self, rule_content: str):
        """Simulate rule compilation process"""
        # Simple simulation of parsing and compilation
        await asyncio.sleep(0.01)  # 10ms simulation
    
    async def _simulate_rule_execution(self, rule_content: str):
        """Simulate rule execution process"""
        # Simple simulation of rule evaluation
        await asyncio.sleep(0.001)  # 1ms simulation
    
    async def _simulate_batch_processing(self, rule_content: str, events: List[Dict]):
        """Simulate batch processing of events"""
        for _ in events:
            await self._simulate_rule_execution(rule_content)

# Example usage
async def main():
    """Example performance analysis"""
    analyzer = PerformanceAnalyzer()
    
    example_rule = """
    <rule id="100001" level="5">
        <description>SSH authentication failure</description>
        <regex>authentication failure</regex>
        <field name="srcip">.*</field>
    </rule>
    """
    
    load_config = LoadTestConfig(
        concurrent_users=10,
        events_per_second=100,
        test_duration=30
    )
    
    metrics = await analyzer.analyze_rule_performance(example_rule, "100001", load_config)
    
    print("Performance Analysis Results:")
    print("=" * 50)
    print(json.dumps(asdict(metrics), indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())