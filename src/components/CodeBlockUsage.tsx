import React from "react";
import CodeBlock from "./CodeBlock";

export default function CodeBlockUsage() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">How to Use CodeBlock Component</h2>

      <p className="text-gray-600">
        The CodeBlock component creates beautiful, animated code blocks with
        copy functionality.
      </p>

      {/* Simple text example */}
      <CodeBlock filename="example.txt">
        This is a simple text example. You can put any content here. The
        component will handle the styling automatically.
      </CodeBlock>

      {/* Code with syntax highlighting */}
      <CodeBlock filename="component.tsx">
        <span className="code-keyword">import</span> React{" "}
        <span className="code-keyword">from</span>{" "}
        <span className="code-string">&apos;react&apos;</span>;<br />
        <br />
        <span className="code-keyword">export</span>{" "}
        <span className="code-keyword">default</span>{" "}
        <span className="code-keyword">function</span>{" "}
        <span className="code-function">MyComponent</span>() {"{"}
        <br />
        &nbsp;&nbsp;<span className="code-keyword">return</span> (
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;div&gt;Hello World!&lt;/div&gt;
        <br />
        &nbsp;&nbsp;);
        <br />
        {"}"}
      </CodeBlock>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Usage:</h3>
        <pre className="text-sm">
          {`<CodeBlock filename="your-file.tsx">
  Your code content here...
</CodeBlock>`}
        </pre>
      </div>
    </div>
  );
}
