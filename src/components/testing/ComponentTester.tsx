import React, { useState, useEffect } from "react";
import type { Component } from "react";

export interface TestResult {
  component: string;
  test: string;
  status: "pass" | "fail" | "warning";
  message: string;
  timestamp: Date;
}

export interface ComponentTestProps {
  componentName: string;
  testComponent: React.ComponentType<any>;
  testProps?: Record<string, any>;
  tests: ComponentTest[];
}

export interface ComponentTest {
  name: string;
  description: string;
  test: (element: HTMLElement) => boolean | Promise<boolean>;
  expectation: string;
}

const ComponentTester: React.FC<ComponentTestProps> = ({
  componentName,
  testComponent: TestComponent,
  testProps = {},
  tests,
}) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testContainer, setTestContainer] = useState<HTMLDivElement | null>(
    null
  );

  const runTests = async () => {
    setIsRunning(true);
    const newResults: TestResult[] = [];

    for (const test of tests) {
      try {
        const container = testContainer;
        if (!container) {
          newResults.push({
            component: componentName,
            test: test.name,
            status: "fail",
            message: "Test container not found",
            timestamp: new Date(),
          });
          continue;
        }

        const result = await test.test(container);
        newResults.push({
          component: componentName,
          test: test.name,
          status: result ? "pass" : "fail",
          message: result ? `✓ ${test.expectation}` : `✗ ${test.expectation}`,
          timestamp: new Date(),
        });
      } catch (error) {
        newResults.push({
          component: componentName,
          test: test.name,
          status: "fail",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pass":
        return "text-green-600 bg-green-50 border-green-200";
      case "fail":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const passRate =
    results.length > 0
      ? Math.round(
          (results.filter(r => r.status === "pass").length / results.length) *
            100
        )
      : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {componentName} Testing
        </h3>
        <div className="flex items-center space-x-4">
          {results.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pass Rate:{" "}
              <span
                className={`font-semibold ${passRate >= 80 ? "text-green-600" : passRate >= 60 ? "text-yellow-600" : "text-red-600"}`}
              >
                {passRate}%
              </span>
            </div>
          )}
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? "Running Tests..." : "Run Tests"}
          </button>
        </div>
      </div>

      {/* Test Component Preview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Component Preview
        </h4>
        <div
          ref={setTestContainer}
          className="bg-gray-50 dark:bg-gray-800 p-4 rounded border"
          data-testid={`${componentName}-test-container`}
        >
          <TestComponent {...testProps} />
        </div>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Test Results ({results.length} tests)
          </h4>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{result.test}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium
                      ${
                        result.status === "pass"
                          ? "bg-green-100 text-green-800"
                          : result.status === "fail"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Descriptions */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Available Tests
        </h4>
        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className="text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {test.name}:
              </span>{" "}
              <span className="text-gray-600 dark:text-gray-400">
                {test.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Common test utilities
export const commonTests = {
  // Accessibility tests
  hasAriaLabel: (element: HTMLElement) => {
    const interactiveElements = element.querySelectorAll(
      "button, a, input, select, textarea"
    );
    return Array.from(interactiveElements).every(
      el =>
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        el.textContent?.trim()
    );
  },

  // Responsive tests
  isResponsive: (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    return (
      computedStyle.display === "flex" ||
      computedStyle.display === "grid" ||
      element.querySelector('[class*="responsive"]') !== null
    );
  },

  // Performance tests
  rendersQuickly: async (element: HTMLElement) => {
    const start = performance.now();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const end = performance.now();
    return end - start < 16; // Should render within one frame (16ms)
  },

  // Content tests
  hasContent: (element: HTMLElement) => {
    return (
      element.textContent?.trim().length > 0 ||
      element.querySelector("img, svg, video") !== null
    );
  },

  // Theme tests
  supportsThemes: (element: HTMLElement) => {
    return (
      element.classList.contains("dark") ||
      element.querySelector(".dark") !== null ||
      window.getComputedStyle(element).getPropertyValue("--theme-color") !== ""
    );
  },
};

// Default test suite for components
export const createDefaultTests = (componentName: string): ComponentTest[] => [
  {
    name: "Accessibility",
    description:
      "Component has proper ARIA labels and accessibility attributes",
    test: commonTests.hasAriaLabel,
    expectation: "All interactive elements should have proper labels",
  },
  {
    name: "Content",
    description: "Component renders visible content",
    test: commonTests.hasContent,
    expectation: "Component should display text, images, or other content",
  },
  {
    name: "Performance",
    description: "Component renders quickly",
    test: commonTests.rendersQuickly,
    expectation: "Component should render within 16ms",
  },
  {
    name: "Theme Support",
    description: "Component supports dark/light themes",
    test: commonTests.supportsThemes,
    expectation: "Component should adapt to theme changes",
  },
];

export default ComponentTester;
