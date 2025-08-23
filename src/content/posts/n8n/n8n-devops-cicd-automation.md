---
title: "n8n DevOps and CI/CD Automation: Streamlining Development Workflows"
published: 2025-01-20
description: "Automate DevOps workflows with n8n including CI/CD pipelines, infrastructure management, monitoring, deployment automation, and GitOps with practical examples"
image: ""
tags: ["n8n", "DevOps", "CI/CD", "automation", "deployment", "monitoring", "GitOps"]
category: DevOps
draft: false
---

## Introduction: DevOps Automation with n8n

DevOps practices demand seamless automation across the entire software delivery lifecycle. n8n transforms DevOps workflows by providing visual, flexible automation for CI/CD pipelines, infrastructure management, monitoring, and incident response. This guide explores comprehensive DevOps automation patterns using n8n.

## DevOps Automation Architecture

### Core DevOps Capabilities in n8n

1. **Version Control**: GitHub, GitLab, Bitbucket integration
2. **CI/CD Tools**: Jenkins, CircleCI, GitHub Actions, GitLab CI
3. **Container Orchestration**: Docker, Kubernetes, OpenShift
4. **Cloud Providers**: AWS, Azure, GCP, DigitalOcean
5. **Monitoring**: Prometheus, Grafana, Datadog, New Relic
6. **Infrastructure as Code**: Terraform, Ansible, Pulumi

## CI/CD Pipeline Automation

### Example 1: Complete CI/CD Pipeline Orchestration

**Scenario**: Automate the entire CI/CD pipeline from code commit to production deployment with quality gates.

```json
{
  "name": "Enterprise CI/CD Pipeline",
  "nodes": [
    {
      "name": "GitHub Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "github/push",
        "httpMethod": "POST",
        "responseMode": "onReceived"
      }
    },
    {
      "name": "Validate Push Event",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Validate and parse GitHub webhook
          const payload = $json;
          
          // Verify webhook signature
          const signature = $json.headers['x-hub-signature-256'];
          const secret = $credentials.githubWebhookSecret;
          
          const crypto = require('crypto');
          const expectedSig = 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify($json.body))
            .digest('hex');
          
          if (signature !== expectedSig) {
            throw new Error('Invalid webhook signature');
          }
          
          // Extract relevant information
          const pushData = {
            repository: payload.body.repository.full_name,
            branch: payload.body.ref.replace('refs/heads/', ''),
            commit: {
              sha: payload.body.head_commit.id,
              message: payload.body.head_commit.message,
              author: payload.body.head_commit.author.name,
              timestamp: payload.body.head_commit.timestamp
            },
            files: {
              added: payload.body.head_commit.added,
              modified: payload.body.head_commit.modified,
              removed: payload.body.head_commit.removed
            }
          };
          
          // Determine pipeline strategy
          const pipelineConfig = determinePipelineStrategy(pushData);
          
          function determinePipelineStrategy(data) {
            // Branch-based strategy
            const strategies = {
              'main': {
                environment: 'production',
                requiresApproval: true,
                runTests: 'full',
                deploymentType: 'blue-green',
                notifications: ['slack', 'email']
              },
              'develop': {
                environment: 'staging',
                requiresApproval: false,
                runTests: 'full',
                deploymentType: 'rolling',
                notifications: ['slack']
              },
              'feature/*': {
                environment: 'development',
                requiresApproval: false,
                runTests: 'unit',
                deploymentType: 'direct',
                notifications: []
              }
            };
            
            // Match branch pattern
            for (const [pattern, config] of Object.entries(strategies)) {
              if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
                if (regex.test(data.branch)) {
                  return config;
                }
              } else if (data.branch === pattern) {
                return config;
              }
            }
            
            // Default strategy
            return strategies['feature/*'];
          }
          
          return [{
            json: {
              ...pushData,
              pipeline: pipelineConfig,
              pipelineId: 'PIPE-' + Date.now().toString(36).toUpperCase()
            }
          }];
        `
      }
    },
    {
      "name": "Build Docker Image",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": `
          #!/bin/bash
          set -e
          
          # Clone repository
          git clone {{$json.repository}} /tmp/build-{{$json.pipelineId}}
          cd /tmp/build-{{$json.pipelineId}}
          git checkout {{$json.commit.sha}}
          
          # Build Docker image
          docker build \
            --tag {{$json.repository}}:{{$json.commit.sha}} \
            --tag {{$json.repository}}:{{$json.branch}}-latest \
            --build-arg VERSION={{$json.commit.sha}} \
            --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
            --build-arg VCS_REF={{$json.commit.sha}} \
            --cache-from {{$json.repository}}:{{$json.branch}}-latest \
            .
          
          # Scan for vulnerabilities
          trivy image --severity HIGH,CRITICAL {{$json.repository}}:{{$json.commit.sha}}
          
          # Push to registry
          docker push {{$json.repository}}:{{$json.commit.sha}}
          docker push {{$json.repository}}:{{$json.branch}}-latest
          
          # Clean up
          rm -rf /tmp/build-{{$json.pipelineId}}
        `
      }
    },
    {
      "name": "Run Test Suite",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Orchestrate test execution based on strategy
          const config = $json.pipeline;
          const testResults = {
            pipelineId: $json.pipelineId,
            commit: $json.commit.sha,
            tests: []
          };
          
          // Determine which tests to run
          const testSuites = {
            unit: ['npm test', 'npm run test:unit'],
            integration: ['npm run test:integration', 'docker-compose -f test.yml up --abort-on-container-exit'],
            e2e: ['npm run test:e2e', 'cypress run'],
            performance: ['npm run test:performance', 'k6 run performance.js'],
            security: ['npm audit', 'snyk test', 'OWASP dependency-check']
          };
          
          const testsToRun = config.runTests === 'full' 
            ? Object.keys(testSuites)
            : [config.runTests];
          
          // Execute tests in parallel where possible
          const promises = testsToRun.map(async (testType) => {
            const commands = testSuites[testType];
            const results = [];
            
            for (const command of commands) {
              try {
                const result = await executeTest(command, testType);
                results.push(result);
              } catch (error) {
                results.push({
                  command: command,
                  type: testType,
                  status: 'failed',
                  error: error.message,
                  duration: 0
                });
              }
            }
            
            return results;
          });
          
          const allResults = await Promise.all(promises);
          testResults.tests = allResults.flat();
          
          // Calculate overall status
          testResults.passed = testResults.tests.every(t => t.status === 'passed');
          testResults.totalTests = testResults.tests.length;
          testResults.failedTests = testResults.tests.filter(t => t.status === 'failed').length;
          
          // Generate test report
          testResults.report = generateTestReport(testResults);
          
          async function executeTest(command, type) {
            const startTime = Date.now();
            
            // Execute test command
            const result = await $execute(command, {
              cwd: \`/workspace/\${$json.repository}\`,
              timeout: 300000 // 5 minutes
            });
            
            const duration = Date.now() - startTime;
            
            return {
              command: command,
              type: type,
              status: result.exitCode === 0 ? 'passed' : 'failed',
              output: result.stdout,
              error: result.stderr,
              duration: duration,
              exitCode: result.exitCode
            };
          }
          
          function generateTestReport(results) {
            return {
              summary: \`Tests: \${results.totalTests - results.failedTests} passed, \${results.failedTests} failed\`,
              duration: results.tests.reduce((sum, t) => sum + t.duration, 0),
              coverage: calculateCoverage(results),
              recommendations: generateRecommendations(results)
            };
          }
          
          function calculateCoverage(results) {
            // Parse coverage from test output
            const coverageTest = results.tests.find(t => t.output && t.output.includes('Coverage'));
            if (coverageTest) {
              const match = coverageTest.output.match(/Coverage: ([\d.]+)%/);
              return match ? parseFloat(match[1]) : null;
            }
            return null;
          }
          
          function generateRecommendations(results) {
            const recommendations = [];
            
            if (results.failedTests > 0) {
              recommendations.push('Fix failing tests before deployment');
            }
            
            const coverage = results.report.coverage;
            if (coverage && coverage < 80) {
              recommendations.push(\`Increase test coverage (current: \${coverage}%)\`);
            }
            
            const slowTests = results.tests.filter(t => t.duration > 60000);
            if (slowTests.length > 0) {
              recommendations.push(\`Optimize slow tests: \${slowTests.map(t => t.type).join(', ')}\`);
            }
            
            return recommendations;
          }
          
          if (!testResults.passed && config.environment === 'production') {
            throw new Error('Tests failed - blocking production deployment');
          }
          
          return [{json: testResults}];
        `
      }
    },
    {
      "name": "Quality Gate Check",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Comprehensive quality gate evaluation
          const testResults = $json;
          const pipeline = $node['GitHub Webhook'].json.pipeline;
          
          const qualityGates = {
            production: {
              minCoverage: 80,
              maxCriticalIssues: 0,
              maxHighIssues: 3,
              performanceThreshold: 2000, // ms
              securityScore: 8
            },
            staging: {
              minCoverage: 70,
              maxCriticalIssues: 2,
              maxHighIssues: 10,
              performanceThreshold: 3000,
              securityScore: 6
            },
            development: {
              minCoverage: 60,
              maxCriticalIssues: 5,
              maxHighIssues: 20,
              performanceThreshold: 5000,
              securityScore: 4
            }
          };
          
          const gates = qualityGates[pipeline.environment];
          const evaluation = {
            passed: true,
            failures: [],
            warnings: [],
            metrics: {}
          };
          
          // Check test coverage
          if (testResults.report.coverage) {
            evaluation.metrics.coverage = testResults.report.coverage;
            if (testResults.report.coverage < gates.minCoverage) {
              evaluation.failures.push(\`Test coverage \${testResults.report.coverage}% below threshold \${gates.minCoverage}%\`);
              evaluation.passed = false;
            }
          }
          
          // Check security issues
          const securityTest = testResults.tests.find(t => t.type === 'security');
          if (securityTest) {
            const issues = parseSecurityIssues(securityTest.output);
            evaluation.metrics.securityIssues = issues;
            
            if (issues.critical > gates.maxCriticalIssues) {
              evaluation.failures.push(\`\${issues.critical} critical security issues found (max: \${gates.maxCriticalIssues})\`);
              evaluation.passed = false;
            }
            
            if (issues.high > gates.maxHighIssues) {
              evaluation.warnings.push(\`\${issues.high} high security issues found (max: \${gates.maxHighIssues})\`);
            }
          }
          
          // Check performance
          const perfTest = testResults.tests.find(t => t.type === 'performance');
          if (perfTest) {
            const metrics = parsePerformanceMetrics(perfTest.output);
            evaluation.metrics.performance = metrics;
            
            if (metrics.p95 > gates.performanceThreshold) {
              evaluation.warnings.push(\`P95 latency \${metrics.p95}ms exceeds threshold \${gates.performanceThreshold}ms\`);
            }
          }
          
          // Check code quality
          const codeQuality = await checkCodeQuality($node['GitHub Webhook'].json);
          evaluation.metrics.codeQuality = codeQuality;
          
          if (codeQuality.complexity > 10) {
            evaluation.warnings.push(\`High code complexity detected: \${codeQuality.complexity}\`);
          }
          
          function parseSecurityIssues(output) {
            // Parse security scan output
            const critical = (output.match(/critical/gi) || []).length;
            const high = (output.match(/high/gi) || []).length;
            const medium = (output.match(/medium/gi) || []).length;
            const low = (output.match(/low/gi) || []).length;
            
            return { critical, high, medium, low };
          }
          
          function parsePerformanceMetrics(output) {
            // Parse performance test output
            const p50Match = output.match(/p50[:\s]+([\d.]+)ms/);
            const p95Match = output.match(/p95[:\s]+([\d.]+)ms/);
            const p99Match = output.match(/p99[:\s]+([\d.]+)ms/);
            
            return {
              p50: p50Match ? parseFloat(p50Match[1]) : 0,
              p95: p95Match ? parseFloat(p95Match[1]) : 0,
              p99: p99Match ? parseFloat(p99Match[1]) : 0
            };
          }
          
          async function checkCodeQuality(data) {
            // Run code quality checks
            const sonarResult = await $http.get(\`https://sonar.example.com/api/measures/component\`, {
              params: {
                component: data.repository,
                metricKeys: 'complexity,duplicated_lines_density,code_smells'
              }
            });
            
            return {
              complexity: sonarResult.data.component.measures[0].value,
              duplication: sonarResult.data.component.measures[1].value,
              codeSmells: sonarResult.data.component.measures[2].value
            };
          }
          
          return [{
            json: {
              ...testResults,
              qualityGate: evaluation,
              canDeploy: evaluation.passed
            }
          }];
        `
      }
    },
    {
      "name": "Deployment Strategy",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "dataType": "expression",
        "value1": "={{$json.pipeline.deploymentType}}",
        "rules": [
          {
            "value2": "blue-green",
            "output": "blueGreenDeployment"
          },
          {
            "value2": "rolling",
            "output": "rollingDeployment"
          },
          {
            "value2": "canary",
            "output": "canaryDeployment"
          },
          {
            "value2": "direct",
            "output": "directDeployment"
          }
        ]
      }
    },
    {
      "name": "Blue-Green Deployment",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Implement blue-green deployment strategy
          const deployment = {
            strategy: 'blue-green',
            environment: $json.pipeline.environment,
            version: $json.commit.sha,
            timestamp: new Date().toISOString()
          };
          
          // Get current active environment
          const currentActive = await getCurrentActiveEnvironment(deployment.environment);
          const targetEnvironment = currentActive === 'blue' ? 'green' : 'blue';
          
          deployment.current = currentActive;
          deployment.target = targetEnvironment;
          
          // Deploy to inactive environment
          const deploymentSteps = [
            {
              name: 'Deploy to ' + targetEnvironment,
              action: async () => {
                return await deployToKubernetes({
                  environment: targetEnvironment,
                  image: \`\${$json.repository}:\${$json.commit.sha}\`,
                  replicas: getReplicaCount(deployment.environment),
                  namespace: \`\${deployment.environment}-\${targetEnvironment}\`
                });
              }
            },
            {
              name: 'Health check',
              action: async () => {
                return await performHealthCheck(targetEnvironment, deployment.environment);
              }
            },
            {
              name: 'Smoke tests',
              action: async () => {
                return await runSmokeTests(targetEnvironment, deployment.environment);
              }
            },
            {
              name: 'Switch traffic',
              action: async () => {
                return await switchTraffic(currentActive, targetEnvironment, deployment.environment);
              }
            },
            {
              name: 'Monitor metrics',
              action: async () => {
                return await monitorDeployment(targetEnvironment, deployment.environment, 300000); // 5 minutes
              }
            }
          ];
          
          // Execute deployment steps
          deployment.steps = [];
          for (const step of deploymentSteps) {
            try {
              const result = await step.action();
              deployment.steps.push({
                name: step.name,
                status: 'success',
                result: result
              });
            } catch (error) {
              deployment.steps.push({
                name: step.name,
                status: 'failed',
                error: error.message
              });
              
              // Rollback on failure
              if (step.name === 'Switch traffic' || step.name === 'Monitor metrics') {
                await rollbackDeployment(currentActive, targetEnvironment, deployment.environment);
                deployment.rolledBack = true;
              }
              
              throw error;
            }
          }
          
          async function getCurrentActiveEnvironment(env) {
            const response = await $http.get(\`https://k8s-api.example.com/\${env}/active\`);
            return response.data.active;
          }
          
          async function deployToKubernetes(config) {
            const manifest = {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              metadata: {
                name: \`app-\${config.environment}\`,
                namespace: config.namespace
              },
              spec: {
                replicas: config.replicas,
                selector: {
                  matchLabels: {
                    app: 'myapp',
                    environment: config.environment
                  }
                },
                template: {
                  metadata: {
                    labels: {
                      app: 'myapp',
                      environment: config.environment,
                      version: $json.commit.sha
                    }
                  },
                  spec: {
                    containers: [{
                      name: 'app',
                      image: config.image,
                      ports: [{ containerPort: 8080 }],
                      env: [
                        { name: 'ENVIRONMENT', value: config.environment },
                        { name: 'VERSION', value: $json.commit.sha }
                      ],
                      livenessProbe: {
                        httpGet: {
                          path: '/health',
                          port: 8080
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 10
                      },
                      readinessProbe: {
                        httpGet: {
                          path: '/ready',
                          port: 8080
                        },
                        initialDelaySeconds: 5,
                        periodSeconds: 5
                      }
                    }]
                  }
                }
              }
            };
            
            const response = await $http.post(\`https://k8s-api.example.com/apis/apps/v1/namespaces/\${config.namespace}/deployments\`, manifest);
            
            // Wait for rollout to complete
            await waitForRollout(config.namespace, \`app-\${config.environment}\`);
            
            return response.data;
          }
          
          async function performHealthCheck(environment, envType) {
            const maxRetries = 30;
            const retryDelay = 10000; // 10 seconds
            
            for (let i = 0; i < maxRetries; i++) {
              try {
                const response = await $http.get(\`https://\${environment}-\${envType}.example.com/health\`);
                if (response.status === 200 && response.data.status === 'healthy') {
                  return { healthy: true, attempts: i + 1 };
                }
              } catch (error) {
                // Continue retrying
              }
              
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            
            throw new Error('Health check failed after ' + maxRetries + ' attempts');
          }
          
          async function runSmokeTests(environment, envType) {
            const tests = [
              { name: 'API availability', endpoint: '/api/v1/status' },
              { name: 'Database connection', endpoint: '/api/v1/health/db' },
              { name: 'Authentication', endpoint: '/api/v1/auth/verify' },
              { name: 'Critical feature', endpoint: '/api/v1/core/test' }
            ];
            
            const results = [];
            for (const test of tests) {
              try {
                const response = await $http.get(\`https://\${environment}-\${envType}.example.com\${test.endpoint}\`);
                results.push({
                  test: test.name,
                  passed: response.status === 200,
                  response: response.data
                });
              } catch (error) {
                results.push({
                  test: test.name,
                  passed: false,
                  error: error.message
                });
              }
            }
            
            const allPassed = results.every(r => r.passed);
            if (!allPassed) {
              throw new Error('Smoke tests failed: ' + JSON.stringify(results.filter(r => !r.passed)));
            }
            
            return results;
          }
          
          async function switchTraffic(from, to, environment) {
            // Update load balancer or ingress
            const ingress = {
              apiVersion: 'networking.k8s.io/v1',
              kind: 'Ingress',
              metadata: {
                name: \`\${environment}-ingress\`,
                namespace: environment
              },
              spec: {
                rules: [{
                  host: \`\${environment}.example.com\`,
                  http: {
                    paths: [{
                      path: '/',
                      pathType: 'Prefix',
                      backend: {
                        service: {
                          name: \`app-\${to}-service\`,
                          port: { number: 80 }
                        }
                      }
                    }]
                  }
                }]
              }
            };
            
            await $http.put(\`https://k8s-api.example.com/apis/networking.k8s.io/v1/namespaces/\${environment}/ingresses/\${environment}-ingress\`, ingress);
            
            // Update active environment marker
            await $http.put(\`https://k8s-api.example.com/\${environment}/active\`, { active: to });
            
            return { switched: true, from: from, to: to };
          }
          
          async function monitorDeployment(environment, envType, duration) {
            const startTime = Date.now();
            const metrics = {
              errorRate: [],
              responseTime: [],
              throughput: []
            };
            
            while (Date.now() - startTime < duration) {
              const currentMetrics = await fetchMetrics(environment, envType);
              
              metrics.errorRate.push(currentMetrics.errorRate);
              metrics.responseTime.push(currentMetrics.responseTime);
              metrics.throughput.push(currentMetrics.throughput);
              
              // Check for anomalies
              if (currentMetrics.errorRate > 5) {
                throw new Error(\`High error rate detected: \${currentMetrics.errorRate}%\`);
              }
              
              if (currentMetrics.responseTime > 2000) {
                throw new Error(\`High response time detected: \${currentMetrics.responseTime}ms\`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
            }
            
            return {
              avgErrorRate: metrics.errorRate.reduce((a, b) => a + b, 0) / metrics.errorRate.length,
              avgResponseTime: metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length,
              avgThroughput: metrics.throughput.reduce((a, b) => a + b, 0) / metrics.throughput.length
            };
          }
          
          async function fetchMetrics(environment, envType) {
            const response = await $http.get(\`https://metrics-api.example.com/query\`, {
              params: {
                query: \`rate(http_requests_total{environment="\${environment}-\${envType}"}[5m])\`
              }
            });
            
            return {
              errorRate: parseFloat(response.data.errorRate),
              responseTime: parseFloat(response.data.responseTime),
              throughput: parseFloat(response.data.throughput)
            };
          }
          
          async function rollbackDeployment(to, from, environment) {
            // Switch traffic back
            await switchTraffic(from, to, environment);
            
            // Scale down failed deployment
            await $http.patch(\`https://k8s-api.example.com/apis/apps/v1/namespaces/\${environment}-\${from}/deployments/app-\${from}/scale\`, {
              spec: { replicas: 0 }
            });
            
            return { rolledBack: true };
          }
          
          async function waitForRollout(namespace, deployment) {
            const maxWait = 600000; // 10 minutes
            const checkInterval = 5000; // 5 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWait) {
              const response = await $http.get(\`https://k8s-api.example.com/apis/apps/v1/namespaces/\${namespace}/deployments/\${deployment}\`);
              
              const status = response.data.status;
              if (status.replicas === status.readyReplicas && status.replicas === status.updatedReplicas) {
                return true;
              }
              
              await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
            
            throw new Error('Deployment rollout timeout');
          }
          
          function getReplicaCount(environment) {
            const replicas = {
              production: 10,
              staging: 5,
              development: 2
            };
            return replicas[environment] || 2;
          }
          
          deployment.status = 'success';
          deployment.activeEnvironment = targetEnvironment;
          
          return [{json: deployment}];
        `
      }
    }
  ]
}
```

### Example 2: GitOps Workflow Automation

**Scenario**: Implement GitOps practices with automated synchronization between Git and Kubernetes.

```javascript
// GitOps Automation System
const gitOpsSystem = {
  name: "GitOps Synchronization Pipeline",
  
  // Git repository monitor
  gitMonitor: {
    type: "n8n-nodes-base.cron",
    parameters: {
      cronExpression: "*/5 * * * *" // Every 5 minutes
    }
  },
  
  // Sync checker
  syncChecker: {
    type: "n8n-nodes-base.function",
    code: `
      // Check for drift between Git and cluster state
      const gitOpsConfig = {
        repository: 'https://github.com/company/k8s-manifests',
        branch: 'main',
        paths: {
          production: 'clusters/production',
          staging: 'clusters/staging',
          development: 'clusters/development'
        }
      };
      
      const driftReport = {
        timestamp: new Date().toISOString(),
        environments: {},
        totalDrift: 0,
        requiresSync: false
      };
      
      // Check each environment
      for (const [env, path] of Object.entries(gitOpsConfig.paths)) {
        const drift = await checkEnvironmentDrift(env, path);
        driftReport.environments[env] = drift;
        driftReport.totalDrift += drift.changes.length;
        if (drift.changes.length > 0) {
          driftReport.requiresSync = true;
        }
      }
      
      async function checkEnvironmentDrift(environment, gitPath) {
        // Get manifests from Git
        const gitManifests = await fetchGitManifests(gitPath);
        
        // Get current cluster state
        const clusterState = await fetchClusterState(environment);
        
        // Compare and find drift
        const changes = compareManifests(gitManifests, clusterState);
        
        return {
          environment: environment,
          gitPath: gitPath,
          changes: changes,
          lastSync: await getLastSyncTime(environment)
        };
      }
      
      async function fetchGitManifests(path) {
        const response = await $http.get(\`https://api.github.com/repos/company/k8s-manifests/contents/\${path}\`, {
          headers: {
            'Authorization': \`token \${$credentials.githubToken}\`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        const manifests = [];
        for (const file of response.data) {
          if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
            const content = await $http.get(file.download_url);
            manifests.push({
              name: file.name,
              path: file.path,
              content: content.data,
              sha: file.sha
            });
          }
        }
        
        return manifests;
      }
      
      async function fetchClusterState(environment) {
        const resources = [
          'deployments',
          'services',
          'configmaps',
          'secrets',
          'ingresses',
          'horizontalpodautoscalers'
        ];
        
        const state = {};
        
        for (const resource of resources) {
          const response = await $http.get(\`https://k8s-api.example.com/\${environment}/\${resource}\`);
          state[resource] = response.data.items;
        }
        
        return state;
      }
      
      function compareManifests(gitManifests, clusterState) {
        const changes = [];
        
        for (const manifest of gitManifests) {
          const gitResource = parseYaml(manifest.content);
          const clusterResource = findClusterResource(clusterState, gitResource);
          
          if (!clusterResource) {
            changes.push({
              type: 'create',
              resource: gitResource,
              manifest: manifest.name
            });
          } else {
            const diff = deepDiff(gitResource, clusterResource);
            if (diff.length > 0) {
              changes.push({
                type: 'update',
                resource: gitResource,
                differences: diff,
                manifest: manifest.name
              });
            }
          }
        }
        
        // Check for resources to delete (in cluster but not in Git)
        for (const [type, resources] of Object.entries(clusterState)) {
          for (const resource of resources) {
            if (!gitManifests.some(m => {
              const gitResource = parseYaml(m.content);
              return gitResource.metadata.name === resource.metadata.name &&
                     gitResource.kind.toLowerCase() === type.slice(0, -1);
            })) {
              changes.push({
                type: 'delete',
                resource: resource,
                resourceType: type
              });
            }
          }
        }
        
        return changes;
      }
      
      function parseYaml(content) {
        // Simple YAML parsing (use proper library in production)
        const yaml = require('js-yaml');
        return yaml.load(content);
      }
      
      function findClusterResource(state, gitResource) {
        const resourceType = gitResource.kind.toLowerCase() + 's';
        const resources = state[resourceType] || [];
        
        return resources.find(r => 
          r.metadata.name === gitResource.metadata.name &&
          r.metadata.namespace === gitResource.metadata.namespace
        );
      }
      
      function deepDiff(obj1, obj2) {
        const differences = [];
        
        function compare(a, b, path = '') {
          if (typeof a !== typeof b) {
            differences.push({ path, old: a, new: b });
            return;
          }
          
          if (typeof a === 'object' && a !== null) {
            const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
            for (const key of keys) {
              // Ignore certain fields
              if (['resourceVersion', 'uid', 'selfLink', 'creationTimestamp'].includes(key)) {
                continue;
              }
              compare(a[key], b[key], path ? \`\${path}.\${key}\` : key);
            }
          } else if (a !== b) {
            differences.push({ path, old: a, new: b });
          }
        }
        
        compare(obj1, obj2);
        return differences;
      }
      
      async function getLastSyncTime(environment) {
        const response = await $db.query(
          'SELECT timestamp FROM gitops_sync_log WHERE environment = ? ORDER BY timestamp DESC LIMIT 1',
          [environment]
        );
        return response[0]?.timestamp || null;
      }
      
      return [{json: driftReport}];
    `
  },
  
  // Sync executor
  syncExecutor: {
    type: "n8n-nodes-base.function",
    code: `
      // Apply GitOps synchronization
      const driftReport = $json;
      
      if (!driftReport.requiresSync) {
        return [{json: { message: 'No synchronization needed' }}];
      }
      
      const syncResults = {
        timestamp: new Date().toISOString(),
        environments: {},
        success: true
      };
      
      for (const [env, drift] of Object.entries(driftReport.environments)) {
        if (drift.changes.length === 0) continue;
        
        const result = await syncEnvironment(env, drift);
        syncResults.environments[env] = result;
        
        if (!result.success) {
          syncResults.success = false;
        }
      }
      
      async function syncEnvironment(environment, drift) {
        const result = {
          environment: environment,
          changes: [],
          success: true,
          errors: []
        };
        
        // Apply changes in order: delete, update, create
        const changesByType = {
          delete: drift.changes.filter(c => c.type === 'delete'),
          update: drift.changes.filter(c => c.type === 'update'),
          create: drift.changes.filter(c => c.type === 'create')
        };
        
        for (const [type, changes] of Object.entries(changesByType)) {
          for (const change of changes) {
            try {
              const applyResult = await applyChange(environment, change);
              result.changes.push({
                type: type,
                resource: change.resource?.metadata?.name || change.resource?.name,
                status: 'success',
                result: applyResult
              });
            } catch (error) {
              result.changes.push({
                type: type,
                resource: change.resource?.metadata?.name || change.resource?.name,
                status: 'failed',
                error: error.message
              });
              result.success = false;
              result.errors.push(error.message);
            }
          }
        }
        
        // Record sync in database
        await recordSync(environment, result);
        
        return result;
      }
      
      async function applyChange(environment, change) {
        const kubeApi = \`https://k8s-api.example.com/\${environment}\`;
        
        switch (change.type) {
          case 'create':
            return await $http.post(\`\${kubeApi}/apply\`, change.resource);
            
          case 'update':
            return await $http.put(\`\${kubeApi}/apply\`, change.resource);
            
          case 'delete':
            const resource = change.resource;
            return await $http.delete(
              \`\${kubeApi}/\${change.resourceType}/\${resource.metadata.name}\`
            );
            
          default:
            throw new Error(\`Unknown change type: \${change.type}\`);
        }
      }
      
      async function recordSync(environment, result) {
        await $db.query(
          'INSERT INTO gitops_sync_log (environment, timestamp, changes, success, errors) VALUES (?, ?, ?, ?, ?)',
          [
            environment,
            new Date(),
            JSON.stringify(result.changes),
            result.success,
            JSON.stringify(result.errors)
          ]
        );
      }
      
      // Send notifications if sync failed
      if (!syncResults.success) {
        await sendSyncFailureAlert(syncResults);
      }
      
      async function sendSyncFailureAlert(results) {
        const failedEnvs = Object.entries(results.environments)
          .filter(([_, r]) => !r.success)
          .map(([env, _]) => env);
        
        await $slack.send({
          channel: '#gitops-alerts',
          text: \`GitOps sync failed for environments: \${failedEnvs.join(', ')}\`,
          attachments: [{
            color: 'danger',
            fields: failedEnvs.map(env => ({
              title: env,
              value: results.environments[env].errors.join('\n'),
              short: false
            }))
          }]
        });
      }
      
      return [{json: syncResults}];
    `
  }
};
```

## Infrastructure Automation

### Example 3: Infrastructure as Code Automation

**Scenario**: Automate infrastructure provisioning and management using Terraform and cloud APIs.

```javascript
// Infrastructure Automation System
const infrastructureAutomation = {
  name: "IaC Automation Pipeline",
  
  // Infrastructure request handler
  infraRequestHandler: {
    type: "n8n-nodes-base.webhook",
    parameters: {
      path: "infrastructure/request",
      httpMethod: "POST"
    }
  },
  
  // Terraform executor
  terraformExecutor: {
    type: "n8n-nodes-base.function",
    code: `
      // Execute Terraform workflows
      const request = $json;
      
      const terraformConfig = {
        repository: 'https://github.com/company/terraform-modules',
        branch: request.branch || 'main',
        workspace: request.environment,
        autoApprove: request.environment !== 'production'
      };
      
      const execution = {
        id: 'INFRA-' + Date.now().toString(36).toUpperCase(),
        request: request,
        steps: [],
        outputs: {},
        status: 'running'
      };
      
      // Terraform workflow steps
      const steps = [
        { name: 'checkout', fn: checkoutCode },
        { name: 'init', fn: terraformInit },
        { name: 'workspace', fn: selectWorkspace },
        { name: 'plan', fn: terraformPlan },
        { name: 'validate', fn: validatePlan },
        { name: 'apply', fn: terraformApply },
        { name: 'output', fn: captureOutputs },
        { name: 'document', fn: updateDocumentation }
      ];
      
      for (const step of steps) {
        try {
          const result = await step.fn(terraformConfig, request);
          execution.steps.push({
            name: step.name,
            status: 'success',
            result: result,
            timestamp: new Date().toISOString()
          });
          
          // Stop at plan step if not auto-approved
          if (step.name === 'plan' && !terraformConfig.autoApprove) {
            execution.status = 'pending_approval';
            execution.planUrl = result.planUrl;
            break;
          }
        } catch (error) {
          execution.steps.push({
            name: step.name,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          execution.status = 'failed';
          
          // Cleanup on failure
          await cleanupOnFailure(execution);
          break;
        }
      }
      
      async function checkoutCode(config, request) {
        const workDir = \`/tmp/terraform-\${execution.id}\`;
        
        await $execute(\`
          git clone \${config.repository} \${workDir}
          cd \${workDir}
          git checkout \${config.branch}
        \`);
        
        // Apply request-specific configurations
        if (request.variables) {
          const tfvars = Object.entries(request.variables)
            .map(([key, value]) => \`\${key} = "\${value}"\`)
            .join('\n');
          
          await $fs.writeFile(\`\${workDir}/terraform.tfvars\`, tfvars);
        }
        
        return { workDir: workDir };
      }
      
      async function terraformInit(config, request) {
        const workDir = execution.steps[0].result.workDir;
        
        const result = await $execute(\`
          cd \${workDir}
          terraform init \
            -backend-config="bucket=terraform-state-\${config.workspace}" \
            -backend-config="key=\${request.module}/terraform.tfstate" \
            -backend-config="region=us-east-1"
        \`);
        
        return { initialized: true, output: result.stdout };
      }
      
      async function selectWorkspace(config, request) {
        const workDir = execution.steps[0].result.workDir;
        
        // Create or select workspace
        try {
          await $execute(\`cd \${workDir} && terraform workspace select \${config.workspace}\`);
        } catch {
          await $execute(\`cd \${workDir} && terraform workspace new \${config.workspace}\`);
        }
        
        return { workspace: config.workspace };
      }
      
      async function terraformPlan(config, request) {
        const workDir = execution.steps[0].result.workDir;
        const planFile = \`\${workDir}/plan.out\`;
        
        const result = await $execute(\`
          cd \${workDir}
          terraform plan -out=\${planFile}
        \`);
        
        // Parse plan output
        const planSummary = parsePlanOutput(result.stdout);
        
        // Save plan for approval
        if (!config.autoApprove) {
          const planUrl = await savePlanForApproval(planFile, planSummary);
          return { 
            planFile: planFile,
            summary: planSummary,
            planUrl: planUrl
          };
        }
        
        return { 
          planFile: planFile,
          summary: planSummary
        };
      }
      
      async function validatePlan(config, request) {
        const plan = execution.steps.find(s => s.name === 'plan').result;
        
        // Validate against policies
        const violations = await checkPolicies(plan.summary, request);
        
        if (violations.length > 0) {
          throw new Error(\`Policy violations: \${violations.join(', ')}\`);
        }
        
        // Cost estimation
        const costEstimate = await estimateCost(plan.summary);
        
        if (costEstimate.monthly > (request.maxCost || 10000)) {
          throw new Error(\`Estimated cost $\${costEstimate.monthly}/month exceeds limit\`);
        }
        
        return {
          validated: true,
          costEstimate: costEstimate,
          policies: 'passed'
        };
      }
      
      async function terraformApply(config, request) {
        const workDir = execution.steps[0].result.workDir;
        const planFile = execution.steps.find(s => s.name === 'plan').result.planFile;
        
        const result = await $execute(\`
          cd \${workDir}
          terraform apply \${config.autoApprove ? '-auto-approve' : ''} \${planFile}
        \`);
        
        return {
          applied: true,
          output: result.stdout
        };
      }
      
      async function captureOutputs(config, request) {
        const workDir = execution.steps[0].result.workDir;
        
        const result = await $execute(\`
          cd \${workDir}
          terraform output -json
        \`);
        
        const outputs = JSON.parse(result.stdout);
        execution.outputs = outputs;
        
        // Store outputs in database
        await $db.query(
          'INSERT INTO infrastructure_outputs (execution_id, environment, outputs, timestamp) VALUES (?, ?, ?, ?)',
          [execution.id, config.workspace, JSON.stringify(outputs), new Date()]
        );
        
        return outputs;
      }
      
      async function updateDocumentation(config, request) {
        // Generate infrastructure documentation
        const workDir = execution.steps[0].result.workDir;
        
        await $execute(\`
          cd \${workDir}
          terraform-docs markdown . > README.md
          terraform graph | dot -Tpng > infrastructure.png
        \`);
        
        // Commit documentation to Git
        await $execute(\`
          cd \${workDir}
          git add README.md infrastructure.png
          git commit -m "Update infrastructure documentation for \${execution.id}"
          git push origin \${config.branch}
        \`);
        
        return { documented: true };
      }
      
      function parsePlanOutput(output) {
        const summary = {
          toAdd: 0,
          toChange: 0,
          toDestroy: 0,
          resources: []
        };
        
        const addMatch = output.match(/(\d+) to add/);
        const changeMatch = output.match(/(\d+) to change/);
        const destroyMatch = output.match(/(\d+) to destroy/);
        
        if (addMatch) summary.toAdd = parseInt(addMatch[1]);
        if (changeMatch) summary.toChange = parseInt(changeMatch[1]);
        if (destroyMatch) summary.toDestroy = parseInt(destroyMatch[1]);
        
        // Extract resource details
        const resourceRegex = /# (.*) will be (created|updated|destroyed)/g;
        let match;
        while ((match = resourceRegex.exec(output)) !== null) {
          summary.resources.push({
            name: match[1],
            action: match[2]
          });
        }
        
        return summary;
      }
      
      async function savePlanForApproval(planFile, summary) {
        // Upload plan to S3 for approval workflow
        const s3Key = \`terraform-plans/\${execution.id}/plan.out\`;
        
        await $aws.s3.upload({
          Bucket: 'terraform-approvals',
          Key: s3Key,
          Body: await $fs.readFile(planFile)
        });
        
        // Generate pre-signed URL
        const url = await $aws.s3.getSignedUrl('getObject', {
          Bucket: 'terraform-approvals',
          Key: s3Key,
          Expires: 3600 // 1 hour
        });
        
        return url;
      }
      
      async function checkPolicies(plan, request) {
        const violations = [];
        
        // Example policies
        if (plan.toDestroy > 5) {
          violations.push('Cannot destroy more than 5 resources at once');
        }
        
        if (request.environment === 'production' && !request.approvedBy) {
          violations.push('Production changes require approval');
        }
        
        // Check for sensitive resource types
        const sensitiveResources = ['aws_iam_role', 'aws_security_group', 'aws_db_instance'];
        const hasSensitive = plan.resources.some(r => 
          sensitiveResources.some(s => r.name.includes(s))
        );
        
        if (hasSensitive && !request.securityReview) {
          violations.push('Changes to sensitive resources require security review');
        }
        
        return violations;
      }
      
      async function estimateCost(plan) {
        // Integrate with Infracost or similar
        const costEstimate = {
          monthly: 0,
          yearly: 0,
          breakdown: []
        };
        
        // Simple cost estimation based on resource types
        const resourceCosts = {
          'aws_instance': 50,
          'aws_db_instance': 100,
          'aws_eks_cluster': 200,
          'aws_nat_gateway': 45
        };
        
        plan.resources.forEach(resource => {
          for (const [type, cost] of Object.entries(resourceCosts)) {
            if (resource.name.includes(type) && resource.action === 'created') {
              costEstimate.monthly += cost;
              costEstimate.breakdown.push({
                resource: resource.name,
                monthlyCost: cost
              });
            }
          }
        });
        
        costEstimate.yearly = costEstimate.monthly * 12;
        
        return costEstimate;
      }
      
      async function cleanupOnFailure(execution) {
        // Clean up temporary files
        const workDir = execution.steps[0]?.result?.workDir;
        if (workDir) {
          await $execute(\`rm -rf \${workDir}\`);
        }
        
        // Notify team
        await $slack.send({
          channel: '#infrastructure',
          text: \`Infrastructure execution \${execution.id} failed\`,
          attachments: [{
            color: 'danger',
            fields: [{
              title: 'Failed Step',
              value: execution.steps[execution.steps.length - 1].name
            }]
          }]
        });
      }
      
      if (execution.status === 'running') {
        execution.status = 'success';
      }
      
      return [{json: execution}];
    `
  }
};
```

## Monitoring and Alerting Automation

### Example 4: Intelligent Monitoring and Incident Response

**Scenario**: Automate monitoring, alerting, and incident response workflows.

```javascript
// Monitoring and Incident Automation
const monitoringAutomation = {
  name: "Intelligent Monitoring System",
  
  // Alert processor
  alertProcessor: {
    type: "n8n-nodes-base.webhook",
    parameters: {
      path: "alerts/receive"
    }
  },
  
  // Intelligent alert handler
  alertHandler: {
    type: "n8n-nodes-base.function",
    code: `
      // Process and enrich alerts
      const alert = $json;
      
      const enrichedAlert = {
        ...alert,
        id: 'ALERT-' + Date.now().toString(36).toUpperCase(),
        receivedAt: new Date().toISOString(),
        severity: determineSeverity(alert),
        category: categorizeAlert(alert),
        service: identifyService(alert),
        runbook: getRunbook(alert),
        correlatedAlerts: [],
        incidentCreated: false
      };
      
      // Correlate with existing alerts
      enrichedAlert.correlatedAlerts = await correlateAlerts(enrichedAlert);
      
      // Determine if incident should be created
      const shouldCreateIncident = await evaluateIncidentCriteria(enrichedAlert);
      
      if (shouldCreateIncident) {
        const incident = await createIncident(enrichedAlert);
        enrichedAlert.incidentId = incident.id;
        enrichedAlert.incidentCreated = true;
      }
      
      // Execute auto-remediation if applicable
      if (enrichedAlert.runbook?.autoRemediation) {
        await executeAutoRemediation(enrichedAlert);
      }
      
      function determineSeverity(alert) {
        // Multi-factor severity calculation
        const factors = {
          metricValue: () => {
            if (alert.metric?.value > alert.metric?.critical) return 'critical';
            if (alert.metric?.value > alert.metric?.warning) return 'warning';
            return 'info';
          },
          keywords: () => {
            const criticalKeywords = ['down', 'failure', 'critical', 'outage'];
            const warningKeywords = ['high', 'degraded', 'slow'];
            
            const message = (alert.message || '').toLowerCase();
            
            if (criticalKeywords.some(k => message.includes(k))) return 'critical';
            if (warningKeywords.some(k => message.includes(k))) return 'warning';
            return 'info';
          },
          source: () => {
            const criticalSources = ['production', 'payment', 'authentication'];
            if (criticalSources.some(s => alert.source?.includes(s))) return 'critical';
            return 'warning';
          }
        };
        
        const severities = Object.values(factors).map(f => f());
        
        if (severities.includes('critical')) return 'critical';
        if (severities.includes('warning')) return 'warning';
        return 'info';
      }
      
      function categorizeAlert(alert) {
        const categories = {
          performance: ['latency', 'response time', 'slow', 'timeout'],
          availability: ['down', 'unreachable', 'connection', 'offline'],
          capacity: ['disk', 'memory', 'cpu', 'quota', 'limit'],
          error: ['error', 'exception', 'failed', 'crash'],
          security: ['unauthorized', 'authentication', 'breach', 'attack']
        };
        
        const message = (alert.message || '').toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
          if (keywords.some(k => message.includes(k))) {
            return category;
          }
        }
        
        return 'general';
      }
      
      function identifyService(alert) {
        // Extract service from alert metadata
        if (alert.labels?.service) return alert.labels.service;
        if (alert.tags?.service) return alert.tags.service;
        
        // Try to extract from message
        const servicePattern = /service[:\s]+([a-zA-Z0-9-_]+)/i;
        const match = alert.message?.match(servicePattern);
        if (match) return match[1];
        
        return 'unknown';
      }
      
      function getRunbook(alert) {
        // Fetch runbook for alert type
        const runbooks = {
          'high_cpu': {
            steps: [
              'Check for runaway processes',
              'Review recent deployments',
              'Scale horizontally if needed'
            ],
            autoRemediation: true,
            remediationScript: 'scale_service.sh'
          },
          'disk_full': {
            steps: [
              'Clean up log files',
              'Remove old backups',
              'Expand disk if necessary'
            ],
            autoRemediation: true,
            remediationScript: 'cleanup_disk.sh'
          },
          'service_down': {
            steps: [
              'Check service health endpoint',
              'Review recent changes',
              'Restart service if necessary',
              'Check dependencies'
            ],
            autoRemediation: true,
            remediationScript: 'restart_service.sh'
          }
        };
        
        // Match alert to runbook
        for (const [pattern, runbook] of Object.entries(runbooks)) {
          if (alert.message?.toLowerCase().includes(pattern.replace('_', ' '))) {
            return runbook;
          }
        }
        
        return null;
      }
      
      async function correlateAlerts(alert) {
        // Find related alerts within time window
        const timeWindow = 300000; // 5 minutes
        const relatedAlerts = await $db.query(
          \`SELECT * FROM alerts 
           WHERE service = ? 
           AND category = ?
           AND timestamp > ?
           AND id != ?\`,
          [
            alert.service,
            alert.category,
            new Date(Date.now() - timeWindow),
            alert.id
          ]
        );
        
        // Advanced correlation using ML
        const correlationScores = relatedAlerts.map(related => ({
          alert: related,
          score: calculateCorrelationScore(alert, related)
        }));
        
        return correlationScores
          .filter(c => c.score > 0.7)
          .map(c => c.alert.id);
      }
      
      function calculateCorrelationScore(alert1, alert2) {
        let score = 0;
        
        // Same service
        if (alert1.service === alert2.service) score += 0.3;
        
        // Same category
        if (alert1.category === alert2.category) score += 0.2;
        
        // Similar time
        const timeDiff = Math.abs(new Date(alert1.timestamp) - new Date(alert2.timestamp));
        if (timeDiff < 60000) score += 0.3; // Within 1 minute
        else if (timeDiff < 300000) score += 0.1; // Within 5 minutes
        
        // Similar severity
        if (alert1.severity === alert2.severity) score += 0.2;
        
        return score;
      }
      
      async function evaluateIncidentCriteria(alert) {
        // Criteria for incident creation
        const criteria = [
          alert.severity === 'critical',
          alert.correlatedAlerts.length >= 3,
          alert.category === 'availability' && alert.service !== 'unknown',
          alert.source === 'production'
        ];
        
        const criteriaMet = criteria.filter(Boolean).length;
        
        // Check if incident already exists
        const existingIncident = await $db.query(
          'SELECT * FROM incidents WHERE service = ? AND status = "open"',
          [alert.service]
        );
        
        if (existingIncident.length > 0) {
          // Add alert to existing incident
          await $db.query(
            'INSERT INTO incident_alerts (incident_id, alert_id) VALUES (?, ?)',
            [existingIncident[0].id, alert.id]
          );
          return false;
        }
        
        return criteriaMet >= 2;
      }
      
      async function createIncident(alert) {
        const incident = {
          id: 'INC-' + Date.now().toString(36).toUpperCase(),
          title: \`\${alert.severity.toUpperCase()}: \${alert.message}\`,
          description: alert.details || alert.message,
          severity: alert.severity,
          service: alert.service,
          category: alert.category,
          status: 'open',
          createdAt: new Date().toISOString(),
          alerts: [alert.id, ...alert.correlatedAlerts]
        };
        
        // Store incident
        await $db.query(
          'INSERT INTO incidents (id, title, description, severity, service, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          Object.values(incident)
        );
        
        // Create incident channel
        await createIncidentChannel(incident);
        
        // Notify on-call
        await notifyOncall(incident);
        
        // Start incident timeline
        await startIncidentTimeline(incident);
        
        return incident;
      }
      
      async function executeAutoRemediation(alert) {
        if (!alert.runbook?.remediationScript) return;
        
        const remediation = {
          alertId: alert.id,
          script: alert.runbook.remediationScript,
          startedAt: new Date().toISOString(),
          status: 'running'
        };
        
        try {
          // Execute remediation script
          const result = await $execute(\`/scripts/remediation/\${alert.runbook.remediationScript} \${alert.service}\`);
          
          remediation.status = 'success';
          remediation.output = result.stdout;
          remediation.completedAt = new Date().toISOString();
          
          // Verify remediation
          await verifyRemediation(alert, remediation);
          
        } catch (error) {
          remediation.status = 'failed';
          remediation.error = error.message;
          remediation.completedAt = new Date().toISOString();
          
          // Escalate if auto-remediation fails
          await escalateAlert(alert);
        }
        
        // Record remediation attempt
        await $db.query(
          'INSERT INTO remediations (alert_id, script, status, output, error, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            remediation.alertId,
            remediation.script,
            remediation.status,
            remediation.output,
            remediation.error,
            remediation.startedAt,
            remediation.completedAt
          ]
        );
        
        return remediation;
      }
      
      async function verifyRemediation(alert, remediation) {
        // Wait for metrics to stabilize
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        
        // Check if issue is resolved
        const currentMetric = await fetchCurrentMetric(alert.metric?.name, alert.service);
        
        if (currentMetric > alert.metric?.warning) {
          remediation.status = 'failed';
          remediation.verificationFailed = true;
          throw new Error('Remediation verification failed - metric still above threshold');
        }
      }
      
      async function createIncidentChannel(incident) {
        // Create Slack channel for incident
        const channel = await $slack.createChannel({
          name: \`incident-\${incident.id.toLowerCase()}\`,
          purpose: \`Incident response for \${incident.title}\`,
          is_private: false
        });
        
        // Post initial incident details
        await $slack.postMessage({
          channel: channel.id,
          text: 'Incident created',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: incident.title
              }
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: \`*ID:* \${incident.id}\` },
                { type: 'mrkdwn', text: \`*Severity:* \${incident.severity}\` },
                { type: 'mrkdwn', text: \`*Service:* \${incident.service}\` },
                { type: 'mrkdwn', text: \`*Status:* \${incident.status}\` }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: \`*Description:*\n\${incident.description}\`
              }
            }
          ]
        });
        
        return channel;
      }
      
      async function notifyOncall(incident) {
        // Get on-call engineer
        const oncall = await getOncallEngineer(incident.service);
        
        // Send multiple notification channels
        const notifications = [
          // Slack DM
          $slack.postMessage({
            channel: \`@\${oncall.slackId}\`,
            text: \`🚨 You're being paged for incident \${incident.id}\`
          }),
          
          // SMS
          $twilio.sendSms({
            to: oncall.phone,
            body: \`INCIDENT \${incident.id}: \${incident.title}. Severity: \${incident.severity}\`
          }),
          
          // PagerDuty
          $http.post('https://events.pagerduty.com/v2/enqueue', {
            routing_key: oncall.pagerdutyKey,
            event_action: 'trigger',
            payload: {
              summary: incident.title,
              severity: incident.severity,
              source: incident.service,
              custom_details: incident
            }
          })
        ];
        
        await Promise.all(notifications);
      }
      
      async function startIncidentTimeline(incident) {
        // Initialize incident timeline
        await $db.query(
          'INSERT INTO incident_timeline (incident_id, timestamp, event, details) VALUES (?, ?, ?, ?)',
          [
            incident.id,
            new Date(),
            'incident_created',
            JSON.stringify({
              severity: incident.severity,
              service: incident.service
            })
          ]
        );
      }
      
      async function escalateAlert(alert) {
        // Escalate to next level
        await $slack.postMessage({
          channel: '#critical-alerts',
          text: \`⚠️ Auto-remediation failed for alert \${alert.id}\`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Alert', value: alert.message },
              { title: 'Service', value: alert.service },
              { title: 'Attempted Remediation', value: alert.runbook?.remediationScript }
            ]
          }]
        });
      }
      
      async function fetchCurrentMetric(metricName, service) {
        const response = await $http.get('https://metrics-api.example.com/query', {
          params: {
            query: \`\${metricName}{service="\${service}"}\`
          }
        });
        
        return response.data.value;
      }
      
      async function getOncallEngineer(service) {
        const response = await $http.get('https://oncall-api.example.com/current', {
          params: { service: service }
        });
        
        return response.data;
      }
      
      // Store alert
      await $db.query(
        'INSERT INTO alerts (id, message, severity, category, service, timestamp, incident_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          enrichedAlert.id,
          enrichedAlert.message,
          enrichedAlert.severity,
          enrichedAlert.category,
          enrichedAlert.service,
          new Date(),
          enrichedAlert.incidentId
        ]
      );
      
      return [{json: enrichedAlert}];
    `
  }
};
```

## Best Practices for DevOps Automation

### 1. Pipeline Design
- Implement comprehensive testing at each stage
- Use quality gates to prevent bad deployments
- Maintain rollback capabilities
- Document pipeline configurations

### 2. Security Integration
- Scan for vulnerabilities in CI/CD
- Implement secrets management
- Use least privilege access
- Audit all deployments

### 3. Monitoring and Observability
- Track deployment metrics
- Monitor application performance
- Implement comprehensive logging
- Set up intelligent alerting

### 4. Infrastructure as Code
- Version control all infrastructure
- Use modular, reusable components
- Implement policy as code
- Maintain environment parity

### 5. Incident Management
- Automate incident creation and routing
- Implement runbooks and auto-remediation
- Maintain incident timelines
- Conduct post-mortems

## Conclusion

n8n revolutionizes DevOps automation by providing a visual, flexible platform for orchestrating complex workflows across the entire software delivery lifecycle. From CI/CD pipelines to infrastructure management and incident response, n8n enables teams to build sophisticated automation that scales with their needs while maintaining reliability and security.

The key to successful DevOps automation with n8n lies in thoughtful pipeline design, comprehensive testing, intelligent monitoring, and continuous improvement based on metrics and feedback.