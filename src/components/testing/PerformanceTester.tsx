import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

interface PerformanceTestResult {
  timestamp: Date;
  metrics: PerformanceMetric[];
  score: number;
  recommendations: string[];
}

interface PerformanceMonitorOptions {
  trackRenders?: boolean;
  trackMemory?: boolean;
  trackFPS?: boolean;
  trackBundleSize?: boolean;
  duration?: number; // in milliseconds
}

const PerformanceTester: React.FC<{
  children: React.ReactNode;
  componentName: string;
  options?: PerformanceMonitorOptions;
  autoStart?: boolean;
}> = ({
  children,
  componentName,
  options = {
    trackRenders: true,
    trackMemory: true,
    trackFPS: true,
    trackBundleSize: false,
    duration: 5000
  },
  autoStart = false
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [results, setResults] = useState<PerformanceTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<PerformanceTestResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceDataRef = useRef({
    renderCount: 0,
    renderTimes: [],
    memoryUsage: [],
    frameRates: [],
    startTime: 0,
    endTime: 0
  });

  const resetPerformanceData = useCallback(() => {
    performanceDataRef.current = {
      renderCount: 0,
      renderTimes: [],
      memoryUsage: [],
      frameRates: [],
      startTime: 0,
      endTime: 0
    };
  }, []);

  // FPS monitoring
  const measureFPS = useCallback(() => {
    let frames = 0;
    let lastTime = performance.now();
    const fpsInterval = 1000; // measure every second

    const countFrames = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= fpsInterval) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        performanceDataRef.current.frameRates.push(fps);
        frames = 0;
        lastTime = currentTime;
      }
      
      if (isMonitoring) {
        requestAnimationFrame(countFrames);
      }
    };

    requestAnimationFrame(countFrames);
  }, [isMonitoring]);

  // Memory monitoring
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      performanceDataRef.current.memoryUsage.push({
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
        timestamp: performance.now()
      });
    }
  }, []);

  // Render time monitoring
  const measureRenderTime = useCallback(() => {
    if (containerRef.current) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            performanceDataRef.current.renderTimes.push(entry.duration);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
      
      // Measure render time
      performance.mark('render-start');
      
      // Force a re-render by toggling a class
      const container = containerRef.current;
      container.classList.add('performance-test');
      
      requestAnimationFrame(() => {
        performance.mark('render-end');
        performance.measure('component-render', 'render-start', 'render-end');
        performanceDataRef.current.renderCount++;
        container.classList.remove('performance-test');
      });
      
      return () => observer.disconnect();
    }
  }, []);

  const startPerformanceTest = useCallback(async () => {
    setIsMonitoring(true);
    resetPerformanceData();
    performanceDataRef.current.startTime = performance.now();

    // Start FPS monitoring
    if (options.trackFPS) {
      measureFPS();
    }

    // Monitor memory usage
    if (options.trackMemory) {
      const memoryInterval = setInterval(measureMemory, 100);
      setTimeout(() => clearInterval(memoryInterval), options.duration || 5000);
    }

    // Monitor render performance
    if (options.trackRenders) {
      const renderInterval = setInterval(measureRenderTime, 100);
      setTimeout(() => clearInterval(renderInterval), options.duration || 5000);
    }

    // Stop monitoring after duration
    setTimeout(() => {
      stopPerformanceTest();
    }, options.duration || 5000);
  }, [options, measureFPS, measureMemory, measureRenderTime, resetPerformanceData]);

  const stopPerformanceTest = useCallback(() => {
    setIsMonitoring(false);
    performanceDataRef.current.endTime = performance.now();
    
    // Calculate metrics
    const data = performanceDataRef.current;
    const testDuration = data.endTime - data.startTime;
    
    const metrics: PerformanceMetric[] = [];
    const recommendations: string[] = [];

    // Render performance
    if (options.trackRenders && data.renderTimes.length > 0) {
      const avgRenderTime = data.renderTimes.reduce((a, b) => a + b, 0) / data.renderTimes.length;
      const maxRenderTime = Math.max(...data.renderTimes);
      
      metrics.push({
        name: 'Average Render Time',
        value: parseFloat(avgRenderTime.toFixed(2)),
        unit: 'ms',
        threshold: 16, // 60fps = 16ms per frame
        status: avgRenderTime < 16 ? 'good' : avgRenderTime < 33 ? 'needs-improvement' : 'poor',
        description: 'Time taken to render the component on average'
      });

      metrics.push({
        name: 'Max Render Time',
        value: parseFloat(maxRenderTime.toFixed(2)),
        unit: 'ms',
        threshold: 50,
        status: maxRenderTime < 50 ? 'good' : maxRenderTime < 100 ? 'needs-improvement' : 'poor',
        description: 'Longest single render time observed'
      });

      if (avgRenderTime > 16) {
        recommendations.push('Consider optimizing render performance - average render time exceeds 16ms');
      }
    }

    // FPS performance
    if (options.trackFPS && data.frameRates.length > 0) {
      const avgFPS = data.frameRates.reduce((a, b) => a + b, 0) / data.frameRates.length;
      const minFPS = Math.min(...data.frameRates);
      
      metrics.push({
        name: 'Average FPS',
        value: parseFloat(avgFPS.toFixed(1)),
        unit: 'fps',
        threshold: 60,
        status: avgFPS >= 55 ? 'good' : avgFPS >= 30 ? 'needs-improvement' : 'poor',
        description: 'Average frames per second during monitoring'
      });

      metrics.push({
        name: 'Minimum FPS',
        value: minFPS,
        unit: 'fps',
        threshold: 30,
        status: minFPS >= 30 ? 'good' : minFPS >= 20 ? 'needs-improvement' : 'poor',
        description: 'Lowest FPS recorded during monitoring'
      });

      if (minFPS < 30) {
        recommendations.push('FPS drops below 30 - consider reducing animation complexity');
      }
    }

    // Memory performance
    if (options.trackMemory && data.memoryUsage.length > 0) {
      const latestMemory = data.memoryUsage[data.memoryUsage.length - 1];
      const initialMemory = data.memoryUsage[0];
      const memoryIncrease = latestMemory.used - initialMemory.used;
      const memoryUsagePercent = (latestMemory.used / latestMemory.limit) * 100;
      
      metrics.push({
        name: 'Memory Usage',
        value: parseFloat((latestMemory.used / 1024 / 1024).toFixed(2)),
        unit: 'MB',
        threshold: 50,
        status: latestMemory.used / 1024 / 1024 < 50 ? 'good' : latestMemory.used / 1024 / 1024 < 100 ? 'needs-improvement' : 'poor',
        description: 'Current memory usage of the component'
      });

      metrics.push({
        name: 'Memory Growth',
        value: parseFloat((memoryIncrease / 1024 / 1024).toFixed(2)),
        unit: 'MB',
        threshold: 10,
        status: memoryIncrease / 1024 / 1024 < 10 ? 'good' : memoryIncrease / 1024 / 1024 < 25 ? 'needs-improvement' : 'poor',
        description: 'Memory increase during monitoring period'
      });

      if (memoryIncrease > 10 * 1024 * 1024) {
        recommendations.push('Significant memory increase detected - check for memory leaks');
      }
      
      if (memoryUsagePercent > 70) {
        recommendations.push('High memory usage - consider optimizing memory consumption');
      }
    }

    // Component specific metrics
    metrics.push({
      name: 'Render Count',
      value: data.renderCount,
      unit: 'renders',
      threshold: 50,
      status: data.renderCount < 50 ? 'good' : data.renderCount < 100 ? 'needs-improvement' : 'poor',
      description: 'Number of re-renders during monitoring'
    });

    if (data.renderCount > 50) {
      recommendations.push('High number of re-renders - consider memoization or optimization');
    }

    // Calculate overall score (0-100)
    const goodMetrics = metrics.filter(m => m.status === 'good').length;
    const totalMetrics = metrics.length;
    const score = Math.round((goodMetrics / totalMetrics) * 100);

    const result: PerformanceTestResult = {
      timestamp: new Date(),
      metrics,
      score,
      recommendations
    };

    setCurrentTest(result);
    setResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10 results
  }, [options]);

  useEffect(() => {
    if (autoStart) {
      startPerformanceTest();
    }
  }, [autoStart, startPerformanceTest]);

  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Monitor - {componentName}
          </h3>
          <div className="flex items-center space-x-3">
            {isMonitoring && (
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm">Monitoring...</span>
              </div>
            )}
            <button
              onClick={isMonitoring ? stopPerformanceTest : startPerformanceTest}
              className={`px-4 py-2 rounded font-medium ${
                isMonitoring 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isMonitoring ? 'Stop Test' : 'Start Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Test Results */}
      {currentTest && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Latest Test Results
            </h4>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(currentTest.score)}`}>
                  {currentTest.score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Performance Score</div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {currentTest.metrics.map((metric, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{metric.name}</h5>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    metric.status === 'good' ? 'bg-green-100 text-green-800' :
                    metric.status === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {metric.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {metric.value} {metric.unit}
                </div>
                <div className="text-sm opacity-75 mb-2">
                  Threshold: {metric.threshold} {metric.unit}
                </div>
                <div className="text-xs">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {currentTest.recommendations.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Recommendations
              </h5>
              <ul className="space-y-1">
                {currentTest.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="text-yellow-500 mr-2">⚠</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Test Component */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Component Under Test
        </h4>
        <div 
          ref={containerRef}
          className="bg-gray-50 dark:bg-gray-800 p-4 rounded border"
          data-testid="performance-test-container"
        >
          {children}
        </div>
      </div>

      {/* Test History */}
      {results.length > 1 && (
        <div className="px-6 py-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Test History
          </h4>
          <div className="space-y-2">
            {results.slice(1).map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div className="flex items-center space-x-4">
                  <div className={`text-lg font-medium ${getScoreColor(result.score)}`}>
                    {result.score}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {result.metrics.filter(m => m.status === 'good').length}/{result.metrics.length} metrics passed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <details className="text-sm">
          <summary className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Test Configuration
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Tracking Options:</div>
              <ul className="text-gray-600 dark:text-gray-400 mt-1">
                <li>• Renders: {options.trackRenders ? 'Enabled' : 'Disabled'}</li>
                <li>• Memory: {options.trackMemory ? 'Enabled' : 'Disabled'}</li>
                <li>• FPS: {options.trackFPS ? 'Enabled' : 'Disabled'}</li>
                <li>• Bundle Size: {options.trackBundleSize ? 'Enabled' : 'Disabled'}</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Test Duration:</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">
                {(options.duration || 5000) / 1000} seconds
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PerformanceTester;