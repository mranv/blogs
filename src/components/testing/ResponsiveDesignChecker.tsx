import React, { useState, useEffect, useRef } from "react";

export interface BreakpointTest {
  name: string;
  width: number;
  height: number;
  description: string;
}

export interface ResponsiveTestResult {
  breakpoint: string;
  width: number;
  height: number;
  passed: boolean;
  issues: string[];
  screenshot?: string;
}

const defaultBreakpoints: BreakpointTest[] = [
  {
    name: "Mobile Portrait",
    width: 375,
    height: 667,
    description: "iPhone 8 size",
  },
  {
    name: "Mobile Landscape",
    width: 667,
    height: 375,
    description: "iPhone 8 landscape",
  },
  {
    name: "Tablet Portrait",
    width: 768,
    height: 1024,
    description: "iPad size",
  },
  {
    name: "Tablet Landscape",
    width: 1024,
    height: 768,
    description: "iPad landscape",
  },
  {
    name: "Desktop Small",
    width: 1280,
    height: 720,
    description: "Small laptop",
  },
  {
    name: "Desktop Large",
    width: 1920,
    height: 1080,
    description: "Full HD desktop",
  },
  {
    name: "Ultra Wide",
    width: 2560,
    height: 1440,
    description: "1440p ultrawide",
  },
];

interface ResponsiveDesignCheckerProps {
  children: React.ReactNode;
  customBreakpoints?: BreakpointTest[];
  testInteractions?: boolean;
}

const ResponsiveDesignChecker: React.FC<ResponsiveDesignCheckerProps> = ({
  customBreakpoints = defaultBreakpoints,
  testInteractions = true,
}) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState(
    customBreakpoints[0]
  );
  const [testResults, setTestResults] = useState<ResponsiveTestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeContent, setIframeContent] = useState("");

  useEffect(() => {
    // Create iframe content with the component
    const createIframeContent = () => {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Responsive Test</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { 
              margin: 0; 
              padding: 16px; 
              font-family: system-ui, -apple-system, sans-serif;
              background: #f3f4f6;
            }
            .dark body { background: #111827; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          <div id="test-content">
            <!-- Component content will be injected here -->
          </div>
          <script>
            // Add responsive utilities
            window.addEventListener('resize', () => {
              console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);
            });
          </script>
        </body>
        </html>
      `;
    };
    setIframeContent(createIframeContent());
  }, []);

  const runResponsiveTest = async (
    breakpoint: BreakpointTest
  ): Promise<ResponsiveTestResult> => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return {
        breakpoint: breakpoint.name,
        width: breakpoint.width,
        height: breakpoint.height,
        passed: false,
        issues: ["iframe not available"],
      };
    }

    const issues: string[] = [];

    try {
      // Set iframe dimensions
      iframe.style.width = `${breakpoint.width}px`;
      iframe.style.height = `${breakpoint.height}px`;

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) {
        issues.push("Cannot access iframe content");
      } else {
        // Test for common responsive issues
        const elements = iframeDoc.querySelectorAll("*");

        // Check for horizontal overflow
        Array.from(elements).forEach((el, index) => {
          const element = el as HTMLElement;
          if (element.scrollWidth > breakpoint.width) {
            issues.push(
              `Element ${index} has horizontal overflow (${element.scrollWidth}px > ${breakpoint.width}px)`
            );
          }
        });

        // Check for text readability
        const textElements = iframeDoc.querySelectorAll(
          "p, span, h1, h2, h3, h4, h5, h6"
        );
        Array.from(textElements).forEach(el => {
          const element = el as HTMLElement;
          const computedStyle =
            iframeDoc.defaultView?.getComputedStyle(element);
          if (computedStyle) {
            const fontSize = parseFloat(computedStyle.fontSize);
            if (fontSize < 14 && breakpoint.width < 768) {
              issues.push(`Text too small on mobile: ${fontSize}px`);
            }
          }
        });

        // Check for touch targets on mobile
        if (breakpoint.width < 768) {
          const interactiveElements = iframeDoc.querySelectorAll(
            "button, a, input, select"
          );
          Array.from(interactiveElements).forEach((el, index) => {
            const element = el as HTMLElement;
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              issues.push(
                `Touch target ${index} too small: ${rect.width}x${rect.height}px (minimum 44x44px)`
              );
            }
          });
        }

        // Check for proper spacing
        const containers = iframeDoc.querySelectorAll("div, section, article");
        Array.from(containers).forEach((el, index) => {
          const element = el as HTMLElement;
          const computedStyle =
            iframeDoc.defaultView?.getComputedStyle(element);
          if (computedStyle) {
            const padding =
              parseInt(computedStyle.paddingLeft) +
              parseInt(computedStyle.paddingRight);
            if (breakpoint.width < 768 && padding < 16) {
              issues.push(`Container ${index} needs more padding on mobile`);
            }
          }
        });
      }
    } catch (error) {
      issues.push(
        `Test error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return {
      breakpoint: breakpoint.name,
      width: breakpoint.width,
      height: breakpoint.height,
      passed: issues.length === 0,
      issues,
    };
  };

  const runAllTests = async () => {
    setIsTestingAll(true);
    const results: ResponsiveTestResult[] = [];

    for (const breakpoint of customBreakpoints) {
      setCurrentBreakpoint(breakpoint);
      const result = await runResponsiveTest(breakpoint);
      results.push(result);
    }

    setTestResults(results);
    setIsTestingAll(false);
  };

  const getBreakpointColor = (breakpoint: BreakpointTest) => {
    if (breakpoint.width < 768) return "bg-red-100 text-red-800 border-red-300";
    if (breakpoint.width < 1024)
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Responsive Design Checker
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleOverlay}
              className={`px-3 py-1 text-sm rounded ${
                showOverlay
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Grid Overlay
            </button>
            <button
              onClick={runAllTests}
              disabled={isTestingAll}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {isTestingAll ? "Testing..." : "Test All"}
            </button>
          </div>
        </div>
      </div>

      {/* Breakpoint Selector */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {customBreakpoints.map((breakpoint, index) => (
            <button
              key={index}
              onClick={() => setCurrentBreakpoint(breakpoint)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                currentBreakpoint.name === breakpoint.name
                  ? getBreakpointColor(breakpoint)
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="font-medium">{breakpoint.name}</div>
              <div className="text-xs opacity-75">
                {breakpoint.width} × {breakpoint.height}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Viewport Info */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            Current:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {currentBreakpoint.name}
            </span>{" "}
            - {currentBreakpoint.description}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {currentBreakpoint.width} × {currentBreakpoint.height} px
          </div>
        </div>
      </div>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.passed).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Passed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {testResults.filter(r => !r.passed).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Failed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(
                  (testResults.filter(r => r.passed).length /
                    testResults.length) *
                    100
                )}
                %
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Success Rate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="relative">
        {showOverlay && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        )}
        <div className="p-6">
          <iframe
            ref={iframeRef}
            className="border border-gray-300 dark:border-gray-600 rounded transition-all duration-300"
            style={{
              width: `${currentBreakpoint.width}px`,
              height: `${currentBreakpoint.height}px`,
              maxWidth: "100%",
            }}
            srcDoc={iframeContent}
            title={`Responsive test - ${currentBreakpoint.name}`}
          />
        </div>
      </div>

      {/* Detailed Test Results */}
      {testResults.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Detailed Results
          </h4>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.passed
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {result.breakpoint} ({result.width} × {result.height})
                  </h5>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      result.passed
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                    }`}
                  >
                    {result.passed ? "PASS" : "FAIL"}
                  </span>
                </div>
                {result.issues.length > 0 && (
                  <ul className="space-y-1">
                    {result.issues.map((issue, issueIndex) => (
                      <li
                        key={issueIndex}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        • {issue}
                      </li>
                    ))}
                  </ul>
                )}
                {result.passed && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    All responsive design checks passed for this breakpoint.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveDesignChecker;
