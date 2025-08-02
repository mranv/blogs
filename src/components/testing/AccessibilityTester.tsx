import React, { useState, useEffect, useRef } from 'react';

interface AccessibilityIssue {
  level: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: string;
  suggestion: string;
  wcagGuideline?: string;
}

interface AccessibilityTestResult {
  score: number;
  totalChecks: number;
  passedChecks: number;
  issues: AccessibilityIssue[];
  timestamp: Date;
}

interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  level: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
  check: (container: HTMLElement) => AccessibilityIssue[];
}

const accessibilityRules: AccessibilityRule[] = [
  {
    id: 'alt-text',
    name: 'Images have alt text',
    description: 'All images must have descriptive alt text',
    level: 'error',
    wcagLevel: 'A',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      const images = container.querySelectorAll('img');
      
      images.forEach((img, index) => {
        const alt = img.getAttribute('alt');
        if (!alt) {
          issues.push({
            level: 'error',
            rule: 'Missing alt text',
            description: `Image ${index + 1} is missing alt text`,
            element: `<img src="${img.src || 'unknown'}" />`,
            suggestion: 'Add descriptive alt text to help screen readers understand the image',
            wcagGuideline: 'WCAG 2.1 - 1.1.1 Non-text Content (Level A)'
          });
        } else if (alt.trim() === '') {
          issues.push({
            level: 'warning',
            rule: 'Empty alt text',
            description: `Image ${index + 1} has empty alt text`,
            element: `<img alt="" src="${img.src || 'unknown'}" />`,
            suggestion: 'Use alt="" only for decorative images, otherwise provide descriptive text',
            wcagGuideline: 'WCAG 2.1 - 1.1.1 Non-text Content (Level A)'
          });
        }
      });
      
      return issues;
    }
  },
  {
    id: 'button-labels',
    name: 'Buttons have accessible names',
    description: 'All buttons must have accessible names',
    level: 'error',
    wcagLevel: 'A',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach((button, index) => {
        const hasText = button.textContent?.trim();
        const hasAriaLabel = button.getAttribute('aria-label');
        const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
        
        if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
          issues.push({
            level: 'error',
            rule: 'Button missing accessible name',
            description: `Button ${index + 1} has no accessible name`,
            element: button.outerHTML,
            suggestion: 'Add text content, aria-label, or aria-labelledby attribute',
            wcagGuideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value (Level A)'
          });
        }
      });
      
      return issues;
    }
  },
  {
    id: 'form-labels',
    name: 'Form inputs have labels',
    description: 'All form inputs must have associated labels',
    level: 'error',
    wcagLevel: 'A',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      const inputs = container.querySelectorAll('input, select, textarea');
      
      inputs.forEach((input, index) => {
        const id = input.id;
        const hasLabel = id && container.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          issues.push({
            level: 'error',
            rule: 'Input missing label',
            description: `Input ${index + 1} has no associated label`,
            element: input.outerHTML,
            suggestion: 'Add a <label> element or use aria-label/aria-labelledby',
            wcagGuideline: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)'
          });
        }
      });
      
      return issues;
    }
  },
  {
    id: 'heading-structure',
    name: 'Proper heading hierarchy',
    description: 'Headings should follow a logical hierarchy',
    level: 'warning',
    wcagLevel: 'AA',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      let previousLevel = 0;
      headings.forEach((heading, index) => {
        const currentLevel = parseInt(heading.tagName.substring(1));
        
        if (index === 0 && currentLevel !== 1) {
          issues.push({
            level: 'warning',
            rule: 'Heading hierarchy',
            description: `First heading should be h1, found ${heading.tagName.toLowerCase()}`,
            element: heading.outerHTML,
            suggestion: 'Start with h1 and follow sequential order',
            wcagGuideline: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)'
          });
        }
        
        if (currentLevel > previousLevel + 1) {
          issues.push({
            level: 'warning',
            rule: 'Heading hierarchy skip',
            description: `Heading level skipped: ${heading.tagName.toLowerCase()} after h${previousLevel}`,
            element: heading.outerHTML,
            suggestion: 'Use sequential heading levels (h1, h2, h3, etc.)',
            wcagGuideline: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)'
          });
        }
        
        previousLevel = currentLevel;
      });
      
      return issues;
    }
  },
  {
    id: 'color-contrast',
    name: 'Sufficient color contrast',
    description: 'Text should have sufficient contrast against background',
    level: 'error',
    wcagLevel: 'AA',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      const textElements = container.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, li, td, th');
      
      textElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        // Simple heuristic - this would need a proper contrast calculation in production
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // This is a simplified check - in reality, you'd calculate the actual contrast ratio
          const isLightText = color.includes('255') || color.includes('white');
          const isLightBackground = backgroundColor.includes('255') || backgroundColor.includes('white');
          
          if ((isLightText && isLightBackground) || (!isLightText && !isLightBackground)) {
            issues.push({
              level: 'warning',
              rule: 'Potential contrast issue',
              description: `Element ${index + 1} may have insufficient color contrast`,
              element: element.tagName.toLowerCase(),
              suggestion: 'Verify contrast ratio meets WCAG AA standards (4.5:1 for normal text)',
              wcagGuideline: 'WCAG 2.1 - 1.4.3 Contrast (Minimum) (Level AA)'
            });
          }
        }
      });
      
      return issues;
    }
  },
  {
    id: 'focus-visible',
    name: 'Focus indicators',
    description: 'Interactive elements should have visible focus indicators',
    level: 'error',
    wcagLevel: 'AA',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      const interactiveElements = container.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      
      interactiveElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const outline = computedStyle.outline;
        const outlineStyle = computedStyle.outlineStyle;
        
        if (outline === 'none' || outlineStyle === 'none') {
          // Check if there's a custom focus style
          const hasCustomFocus = element.classList.toString().includes('focus') || 
                                 computedStyle.getPropertyValue('--focus-ring') ||
                                 computedStyle.boxShadow.includes('inset');
          
          if (!hasCustomFocus) {
            issues.push({
              level: 'warning',
              rule: 'Missing focus indicator',
              description: `${element.tagName.toLowerCase()} ${index + 1} may not have a visible focus indicator`,
              element: element.outerHTML.substring(0, 100) + '...',
              suggestion: 'Ensure focus indicators are visible and meet contrast requirements',
              wcagGuideline: 'WCAG 2.1 - 2.4.7 Focus Visible (Level AA)'
            });
          }
        }
      });
      
      return issues;
    }
  },
  {
    id: 'semantic-markup',
    name: 'Semantic HTML usage',
    description: 'Use semantic HTML elements appropriately',
    level: 'info',
    wcagLevel: 'A',
    check: (container) => {
      const issues: AccessibilityIssue[] = [];
      
      // Check for divs that should be buttons
      const clickableDivs = container.querySelectorAll('div[onclick], div[role="button"]');
      clickableDivs.forEach((div, index) => {
        issues.push({
          level: 'info',
          rule: 'Semantic markup',
          description: `Clickable div ${index + 1} should be a button element`,
          element: div.outerHTML.substring(0, 100) + '...',
          suggestion: 'Use <button> instead of <div> for interactive elements',
          wcagGuideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value (Level A)'
        });
      });
      
      // Check for missing landmarks
      const hasMain = container.querySelector('main');
      const hasNav = container.querySelector('nav');
      const hasHeader = container.querySelector('header');
      
      if (!hasMain && container.children.length > 0) {
        issues.push({
          level: 'info',
          rule: 'Missing main landmark',
          description: 'Page content should be contained in a <main> element',
          element: 'document structure',
          suggestion: 'Wrap main content in a <main> element',
          wcagGuideline: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)'
        });
      }
      
      return issues;
    }
  }
];

interface AccessibilityTesterProps {
  children: React.ReactNode;
  autoTest?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  customRules?: AccessibilityRule[];
}

const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  children,
  autoTest = false,
  wcagLevel = 'AA',
  customRules = []
}) => {
  const [testResult, setTestResult] = useState<AccessibilityTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'A' | 'AA' | 'AAA'>(wcagLevel);
  const containerRef = useRef<HTMLDivElement>(null);

  const allRules = [...accessibilityRules, ...customRules];

  const runAccessibilityTest = async () => {
    if (!containerRef.current) return;

    setIsRunning(true);
    
    const applicableRules = allRules.filter(rule => {
      const levels: Record<string, number> = { 'A': 1, 'AA': 2, 'AAA': 3 };
      return levels[rule.wcagLevel] <= levels[selectedLevel];
    });

    const allIssues: AccessibilityIssue[] = [];
    let totalChecks = 0;

    for (const rule of applicableRules) {
      try {
        const issues = rule.check(containerRef.current);
        allIssues.push(...issues);
        totalChecks++;
      } catch (error) {
        console.error(`Error running rule ${rule.id}:`, error);
      }
    }

    const errorCount = allIssues.filter(issue => issue.level === 'error').length;
    const warningCount = allIssues.filter(issue => issue.level === 'warning').length;
    
    // Calculate score based on issues
    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));
    const passedChecks = totalChecks - errorCount;

    setTestResult({
      score,
      totalChecks,
      passedChecks,
      issues: allIssues,
      timestamp: new Date()
    });

    setIsRunning(false);
  };

  useEffect(() => {
    if (autoTest) {
      const timer = setTimeout(runAccessibilityTest, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoTest, selectedLevel]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIssueLevelColor = (level: AccessibilityIssue['level']) => {
    switch (level) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default: return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200';
    }
  };

  const groupedIssues = testResult?.issues.reduce((acc, issue) => {
    if (!acc[issue.level]) acc[issue.level] = [];
    acc[issue.level].push(issue);
    return acc;
  }, {} as Record<string, AccessibilityIssue[]>) || {};

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Accessibility Tester
          </h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as 'A' | 'AA' | 'AAA')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="A">WCAG Level A</option>
              <option value="AA">WCAG Level AA</option>
              <option value="AAA">WCAG Level AAA</option>
            </select>
            <button
              onClick={runAccessibilityTest}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Testing...' : 'Run Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      {testResult && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(testResult.score)}`}>
                {testResult.score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">
                {testResult.issues.filter(i => i.level === 'error').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {testResult.issues.filter(i => i.level === 'warning').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {testResult.issues.filter(i => i.level === 'info').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Info</div>
            </div>
          </div>
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
          data-testid="accessibility-test-container"
        >
          {children}
        </div>
      </div>

      {/* Issues Detail */}
      {testResult && testResult.issues.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Accessibility Issues
          </h4>
          
          {(['error', 'warning', 'info'] as const).map(level => {
            const levelIssues = groupedIssues[level] || [];
            if (levelIssues.length === 0) return null;

            return (
              <div key={level} className="mb-6">
                <h5 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 capitalize">
                  {level}s ({levelIssues.length})
                </h5>
                <div className="space-y-3">
                  {levelIssues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getIssueLevelColor(issue.level)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h6 className="font-medium">{issue.rule}</h6>
                        <span className="text-xs px-2 py-1 rounded bg-white/50 dark:bg-black/20">
                          {issue.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{issue.description}</p>
                      <div className="text-xs space-y-1">
                        <p><strong>Element:</strong> {issue.element}</p>
                        <p><strong>Suggestion:</strong> {issue.suggestion}</p>
                        {issue.wcagGuideline && (
                          <p><strong>WCAG:</strong> {issue.wcagGuideline}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Issues */}
      {testResult && testResult.issues.length === 0 && (
        <div className="px-6 py-8 text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Accessibility Issues Found
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            This component passed all WCAG {selectedLevel} accessibility checks.
          </p>
        </div>
      )}

      {/* Test Rules Info */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <details className="text-sm">
          <summary className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Test Rules ({allRules.filter(r => {
              const levels: Record<string, number> = { 'A': 1, 'AA': 2, 'AAA': 3 };
              return levels[r.wcagLevel] <= levels[selectedLevel];
            }).length} rules for WCAG {selectedLevel})
          </summary>
          <div className="mt-3 space-y-2">
            {allRules
              .filter(r => {
                const levels: Record<string, number> = { 'A': 1, 'AA': 2, 'AAA': 3 };
                return levels[r.wcagLevel] <= levels[selectedLevel];
              })
              .map((rule, index) => (
                <div key={index} className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{rule.name}:</span> {rule.description}
                </div>
              ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default AccessibilityTester;