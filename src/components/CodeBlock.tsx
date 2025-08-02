import React, { useState } from "react";

interface CodeBlockProps {
  filename?: string;
  language?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CodeBlock({
  filename = "app.tsx",
  language = "typescript",
  children,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Extract text content from children
      const textContent =
        typeof children === "string"
          ? children
          : React.Children.toArray(children)
              .map(child => {
                if (typeof child === "string") return child;
                if (React.isValidElement(child)) {
                  return React.Children.toArray(child.props.children)
                    .map(grandChild =>
                      typeof grandChild === "string" ? grandChild : ""
                    )
                    .join("");
                }
                return "";
              })
              .join("");

      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className={`code-block-container ${className}`}>
      <div className="code-border-anim" />
      <div className="code-block-content">
        <div className="code-block-header">
          <span className="code-block-title">{filename}</span>
          <button
            className="code-block-copy-btn"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="code-block-pre">
          <code className="code-block-code">{children}</code>
        </pre>
      </div>
    </div>
  );
}

// Syntax highlighting helper component
export function SyntaxHighlightedCode({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="code-keyword">import</span>{" "}
      <span className="code-operator">{"{"}</span>useState
      <span className="code-operator">{"}"}</span>{" "}
      <span className="code-keyword">from</span>{" "}
      <span className="code-string">&apos;react&apos;</span>;<br />
      <br />
      <span className="code-keyword">function</span>{" "}
      <span className="code-function">Counter</span>() {"{"}
      <br />
      &nbsp;&nbsp;<span className="code-keyword">const</span> [count, setCount]
      = useState(<span className="code-number">0</span>);
      <br />
      <br />
      &nbsp;&nbsp;<span className="code-keyword">return</span> (<br />
      &nbsp;&nbsp;&nbsp;&nbsp;
      <span className="code-function">&lt;button</span>{" "}
      <span className="code-property">onClick</span>=
      <span className="code-string">{"{"}</span>() =&gt; setCount(count +{" "}
      <span className="code-number">1</span>)
      <span className="code-string">{"}"}</span>
      <span className="code-function">&gt;</span>
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clicked {"{"}count{"}"} times
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;
      <span className="code-function">&lt;/button&gt;</span>
      <br />
      &nbsp;&nbsp;);
      <br />
      {"}"}
    </>
  );
}
