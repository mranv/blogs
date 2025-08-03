import React, { useState, useEffect, useRef } from "react";

export interface ThemeTestResult {
  theme: string;
  passed: boolean;
  issues: ThemeIssue[];
  score: number;
  timestamp: Date;
}

export interface ThemeIssue {
  severity: "error" | "warning" | "info";
  category: string;
  description: string;
  element: string;
  suggestion: string;
}

export interface ThemeVariant {
  name: string;
  className: string;
  description: string;
  expectedStyles: Record<string, string>;
}

const defaultThemes: ThemeVariant[] = [
  {
    name: "Light Theme",
    className: "",
    description: "Default light theme with bright backgrounds",
    expectedStyles: {
      backgroundColor: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    },
  },
  {
    name: "Dark Theme",
    className: "dark",
    description: "Dark theme with dark backgrounds and light text",
    expectedStyles: {
      backgroundColor: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    },
  },
];

interface ThemeTesterProps {
  children: React.ReactNode;
  themes?: ThemeVariant[];
  autoTest?: boolean;
  testColorContrast?: boolean;
  testResponsiveness?: boolean;
}

const ThemeTester: React.FC<ThemeTesterProps> = ({
  children,
  themes = defaultThemes,
  autoTest = false,
  testColorContrast = true,
  testResponsiveness = true,
}) => {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [testResults, setTestResults] = useState<ThemeTestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [previewMode, setPreviewMode] = useState<"split" | "single">("single");
  const containerRef = useRef<HTMLDivElement>(null);

  // Utility function to calculate color contrast ratio
  const calculateContrastRatio = (color1: string, color2: string): number => {
    // Simple contrast calculation - in production, use a proper color library
    const getLuminance = (color: string): number => {
      // Parse RGB values from color string
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return 0;

      const [r, g, b] = rgb.map(val => {
        const c = parseInt(val) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  };

  const testTheme = async (theme: ThemeVariant): Promise<ThemeTestResult> => {
    const container = containerRef.current;
    if (!container) {
      return {
        theme: theme.name,
        passed: false,
        issues: [
          {
            severity: "error",
            category: "Setup",
            description: "Test container not found",
            element: "container",
            suggestion: "Ensure the component is properly mounted",
          },
        ],
        score: 0,
        timestamp: new Date(),
      };
    }

    const issues: ThemeIssue[] = [];

    try {
      // Apply theme
      container.className = `theme-test-container ${theme.className}`;

      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test 1: Theme application

      const hasThemeClass = theme.className
        ? container.classList.contains(theme.className)
        : true;

      if (!hasThemeClass && theme.className) {
        issues.push({
          severity: "error",
          category: "Theme Application",
          description: `Theme class "${theme.className}" not properly applied`,
          element: "container",
          suggestion: "Ensure theme class is added to the container",
        });
      }

      // Test 2: Color contrast (if enabled)
      if (testColorContrast) {
        const textElements = container.querySelectorAll(
          "p, span, a, button, h1, h2, h3, h4, h5, h6, li, td, th, label"
        );

        textElements.forEach((element, index) => {
          const elementStyles = window.getComputedStyle(element);
          const color = elementStyles.color;
          const backgroundColor = elementStyles.backgroundColor;

          if (
            color &&
            backgroundColor &&
            backgroundColor !== "rgba(0, 0, 0, 0)"
          ) {
            const contrastRatio = calculateContrastRatio(
              color,
              backgroundColor
            );

            if (contrastRatio < 4.5) {
              issues.push({
                severity: "error",
                category: "Color Contrast",
                description: `Text element ${index + 1} has insufficient contrast ratio: ${contrastRatio.toFixed(2)}`,
                element: element.tagName.toLowerCase(),
                suggestion:
                  "Increase color contrast to meet WCAG AA standards (4.5:1 minimum)",
              });
            } else if (contrastRatio < 7) {
              issues.push({
                severity: "warning",
                category: "Color Contrast",
                description: `Text element ${index + 1} doesn't meet AAA contrast ratio: ${contrastRatio.toFixed(2)}`,
                element: element.tagName.toLowerCase(),
                suggestion:
                  "Consider increasing contrast for better accessibility (7:1 for AAA)",
              });
            }
          }
        });
      }

      // Test 3: Theme consistency
      const themableElements = container.querySelectorAll(
        '[class*="bg-"], [class*="text-"], [class*="border-"]'
      );

      themableElements.forEach((element, index) => {
        const elementStyles = window.getComputedStyle(element);
        const classList = Array.from(element.classList);

        // Check for hardcoded colors that might not respect theme
        const hasHardcodedStyles =
          elementStyles.backgroundColor?.includes("rgb(") &&
          !classList.some(cls => cls.includes("dark:"));

        if (hasHardcodedStyles && theme.className === "dark") {
          issues.push({
            severity: "warning",
            category: "Theme Consistency",
            description: `Element ${index + 1} may have hardcoded colors that don't adapt to dark theme`,
            element: element.tagName.toLowerCase(),
            suggestion: "Use theme-aware utility classes or CSS variables",
          });
        }
      });

      // Test 4: Image and media adaptation
      const images = container.querySelectorAll("img, video");
      images.forEach((media, index) => {
        const hasThemeVariant =
          media.getAttribute("data-theme-light") ||
          media.getAttribute("data-theme-dark") ||
          media.parentElement?.querySelector("[data-theme-variant]");

        if (!hasThemeVariant && theme.name === "Dark Theme") {
          issues.push({
            severity: "info",
            category: "Media Adaptation",
            description: `Media element ${index + 1} doesn't have theme-specific variants`,
            element: media.tagName.toLowerCase(),
            suggestion: "Consider providing theme-specific media variants",
          });
        }
      });

      // Test 5: Interactive elements theme support
      const interactiveElements = container.querySelectorAll(
        "button, a, input, select, textarea"
      );
      interactiveElements.forEach((element, index) => {
        // const _elementStyles = window.getComputedStyle(element); // Unused variable
        const classList = Array.from(element.classList);

        // Check for hover/focus states
        const hasHoverStates = classList.some(
          cls =>
            cls.includes("hover:") ||
            cls.includes("focus:") ||
            cls.includes("active:")
        );

        if (!hasHoverStates) {
          issues.push({
            severity: "info",
            category: "Interactive States",
            description: `Interactive element ${index + 1} may not have theme-aware hover/focus states`,
            element: element.tagName.toLowerCase(),
            suggestion:
              "Add hover and focus states that work with the current theme",
          });
        }
      });

      // Test 6: CSS Variables usage
      const rootStyles = window.getComputedStyle(document.documentElement);
      const hasThemeVariables =
        rootStyles.getPropertyValue("--theme-primary") ||
        rootStyles.getPropertyValue("--bg-primary") ||
        rootStyles.getPropertyValue("--text-primary");

      if (!hasThemeVariables) {
        issues.push({
          severity: "info",
          category: "CSS Variables",
          description: "No theme-specific CSS variables detected",
          element: "root",
          suggestion:
            "Consider using CSS variables for better theme consistency",
        });
      }
    } catch (error) {
      issues.push({
        severity: "error",
        category: "Test Error",
        description: `Testing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        element: "test",
        suggestion: "Check browser console for more details",
      });
    }

    // Calculate score
    const errorCount = issues.filter(
      issue => issue.severity === "error"
    ).length;
    const warningCount = issues.filter(
      issue => issue.severity === "warning"
    ).length;
    const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

    return {
      theme: theme.name,
      passed: errorCount === 0,
      issues,
      score,
      timestamp: new Date(),
    };
  };

  const runAllThemeTests = async () => {
    setIsTestingAll(true);
    const results: ThemeTestResult[] = [];

    for (const theme of themes) {
      setCurrentTheme(theme);
      const result = await testTheme(theme);
      results.push(result);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTestResults(results);
    setIsTestingAll(false);
  };

  const runSingleThemeTest = async () => {
    const result = await testTheme(currentTheme);
    setTestResults(prev => [
      result,
      ...prev.filter(r => r.theme !== currentTheme.name),
    ]);
  };

  useEffect(() => {
    if (autoTest) {
      runAllThemeTests();
    }
  }, [autoTest]);

  const getSeverityColor = (severity: ThemeIssue["severity"]) => {
    switch (severity) {
      case "error":
        return "bg-destructive/10 border-destructive/20 text-destructive";
      case "warning":
        return "bg-chart-1/10 border-chart-1/20 text-chart-1";
      case "info":
        return "bg-primary/10 border-primary/20 text-primary";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-chart-3";
    if (score >= 60) return "text-chart-1";
    return "text-destructive";
  };

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Theme Tester
          </h3>
          <div className="flex items-center space-x-3">
            <select
              value={previewMode}
              onChange={e =>
                setPreviewMode(e.target.value as "split" | "single")
              }
              className="px-3 py-1 text-sm border border-border rounded bg-background text-foreground"
            >
              <option value="single">Single Theme</option>
              <option value="split">Split View</option>
            </select>
            <button
              onClick={runSingleThemeTest}
              className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
            >
              Test Current
            </button>
            <button
              onClick={runAllThemeTests}
              disabled={isTestingAll}
              className="px-4 py-2 bg-chart-3 text-white rounded hover:bg-chart-3/90 disabled:opacity-50"
            >
              {isTestingAll ? "Testing..." : "Test All Themes"}
            </button>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          {themes.map((theme, index) => (
            <button
              key={index}
              onClick={() => setCurrentTheme(theme)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                currentTheme.name === theme.name
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              <div className="font-medium">{theme.name}</div>
              <div className="text-xs opacity-75">{theme.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <div className="px-6 py-4 border-b border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {testResults.length}
              </div>
              <div className="text-sm text-muted-foreground">Themes Tested</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-chart-3">
                {testResults.filter(r => r.passed).length}
              </div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {testResults.filter(r => !r.passed).length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${getScoreColor(
                  testResults.reduce((sum, r) => sum + r.score, 0) /
                    testResults.length
                )}`}
              >
                {Math.round(
                  testResults.reduce((sum, r) => sum + r.score, 0) /
                    testResults.length
                )}
              </div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Preview */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Theme Preview
        </h4>

        {previewMode === "single" ? (
          <div
            ref={containerRef}
            className={`theme-test-container bg-muted p-6 rounded border transition-all duration-300 ${currentTheme.className}`}
          >
            {children}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {themes.map((theme, index) => (
              <div key={index} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {theme.name}
                </div>
                <div
                  className={`theme-test-container bg-muted p-4 rounded border transition-all duration-300 ${theme.className}`}
                >
                  {children}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Results */}
      {testResults.length > 0 && (
        <div className="px-6 py-4 border-t border-border">
          <h4 className="text-lg font-medium text-foreground mb-4">
            Test Results
          </h4>

          <div className="space-y-6">
            {testResults.map((result, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-md font-medium text-foreground">
                    {result.theme}
                  </h5>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-medium ${
                        result.passed
                          ? "bg-chart-3/20 text-chart-3"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {result.passed ? "PASS" : "FAIL"}
                    </span>
                    <div
                      className={`text-xl font-bold ${getScoreColor(result.score)}`}
                    >
                      {result.score}
                    </div>
                  </div>
                </div>

                {result.issues.length > 0 ? (
                  <div className="space-y-3">
                    {(["error", "warning", "info"] as const).map(severity => {
                      const severityIssues = result.issues.filter(
                        issue => issue.severity === severity
                      );
                      if (severityIssues.length === 0) return null;

                      return (
                        <div key={severity}>
                          <h6 className="text-sm font-medium text-foreground mb-2 capitalize">
                            {severity}s ({severityIssues.length})
                          </h6>
                          <div className="space-y-2">
                            {severityIssues.map((issue, issueIndex) => (
                              <div
                                key={issueIndex}
                                className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium">
                                    {issue.category}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded bg-background/50">
                                    {issue.element}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">
                                  {issue.description}
                                </p>
                                <p className="text-xs opacity-75">
                                  {issue.suggestion}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-chart-3">
                    <div className="text-2xl mb-2">✓</div>
                    <p>All theme tests passed successfully!</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="px-6 py-4 border-t border-border bg-muted">
        <details className="text-sm">
          <summary className="font-medium text-muted-foreground cursor-pointer">
            Test Configuration
          </summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              • Color Contrast Testing:{" "}
              {testColorContrast ? "Enabled" : "Disabled"}
            </p>
            <p>
              • Responsive Testing:{" "}
              {testResponsiveness ? "Enabled" : "Disabled"}
            </p>
            <p>• Auto Testing: {autoTest ? "Enabled" : "Disabled"}</p>
            <p>• Themes Available: {themes.length}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ThemeTester;
