import React from "react";
import CodeBlock from "./CodeBlock";

export default function CodeBlockDemo() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Beautiful Code Blocks
      </h1>

      {/* React TypeScript Example */}
      <CodeBlock filename="Counter.tsx">
        <span className="code-keyword">import</span>{" "}
        <span className="code-operator">{"{"}</span>useState
        <span className="code-operator">{"}"}</span>{" "}
        <span className="code-keyword">from</span>{" "}
        <span className="code-string">&apos;react&apos;</span>;<br />
        <br />
        <span className="code-keyword">function</span>{" "}
        <span className="code-function">Counter</span>() {"{"}
        <br />
        &nbsp;&nbsp;<span className="code-keyword">const</span> [count,
        setCount] = useState(<span className="code-number">0</span>);
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
      </CodeBlock>

      {/* JavaScript Example */}
      <CodeBlock filename="utils.js">
        <span className="code-keyword">const</span>{" "}
        <span className="code-function">formatDate</span> = (
        <span className="code-property">date</span>) =&gt; {"{"}
        <br />
        &nbsp;&nbsp;<span className="code-keyword">const</span>{" "}
        <span className="code-property">options</span> = {"{"}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;year:{" "}
        <span className="code-string">&apos;numeric&apos;</span>,
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;month:{" "}
        <span className="code-string">&apos;long&apos;</span>,
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;day:{" "}
        <span className="code-string">&apos;numeric&apos;</span>
        <br />
        &nbsp;&nbsp;{"}"};
        <br />
        <br />
        &nbsp;&nbsp;<span className="code-keyword">return</span>{" "}
        date.toLocaleDateString(
        <span className="code-string">&apos;en-US&apos;</span>, options);
        <br />
        {"}"};
        <br />
        <br />
        <span className="code-keyword">export</span>{" "}
        <span className="code-keyword">default</span> formatDate;
      </CodeBlock>

      {/* CSS Example */}
      <CodeBlock filename="styles.css">
        <span className="code-function">.gradient-button</span> {"{"}
        <br />
        &nbsp;&nbsp;background:{" "}
        <span className="code-function">linear-gradient</span>(
        <span className="code-number">45deg</span>,{" "}
        <span className="code-string">#667eea</span>,{" "}
        <span className="code-string">#764ba2</span>);
        <br />
        &nbsp;&nbsp;border: <span className="code-number">none</span>;
        <br />
        &nbsp;&nbsp;border-radius: <span className="code-number">8px</span>;
        <br />
        &nbsp;&nbsp;color: <span className="code-string">white</span>;
        <br />
        &nbsp;&nbsp;padding: <span className="code-number">12px</span>{" "}
        <span className="code-number">24px</span>;
        <br />
        &nbsp;&nbsp;font-weight: <span className="code-number">600</span>;
        <br />
        &nbsp;&nbsp;transition:{" "}
        <span className="code-string">all 0.3s ease</span>;
        <br />
        {"}"}
        <br />
        <br />
        <span className="code-function">.gradient-button:hover</span> {"{"}
        <br />
        &nbsp;&nbsp;transform: <span className="code-function">translateY</span>
        (<span className="code-number">-2px</span>);
        <br />
        &nbsp;&nbsp;box-shadow: <span className="code-number">0</span>{" "}
        <span className="code-number">8px</span>{" "}
        <span className="code-number">25px</span>{" "}
        <span className="code-function">rgba</span>(
        <span className="code-number">0</span>,{" "}
        <span className="code-number">0</span>,{" "}
        <span className="code-number">0</span>,{" "}
        <span className="code-number">0.2</span>);
        <br />
        {"}"}
      </CodeBlock>

      {/* Python Example */}
      <CodeBlock filename="data_processor.py">
        <span className="code-keyword">import</span> pandas{" "}
        <span className="code-keyword">as</span> pd
        <br />
        <span className="code-keyword">import</span> numpy{" "}
        <span className="code-keyword">as</span> np
        <br />
        <br />
        <span className="code-keyword">def</span>{" "}
        <span className="code-function">process_data</span>(
        <span className="code-property">file_path</span>):
        <br />
        &nbsp;&nbsp;
        <span className="code-string">
          &quot;&quot;&quot;Process CSV data and return cleaned
          dataframe&quot;&quot;&quot;
        </span>
        <br />
        &nbsp;&nbsp;df = pd.read_csv(file_path)
        <br />
        <br />
        &nbsp;&nbsp;<span className="code-comment"># Remove duplicates</span>
        <br />
        &nbsp;&nbsp;df = df.drop_duplicates()
        <br />
        <br />
        &nbsp;&nbsp;<span className="code-comment"># Fill missing values</span>
        <br />
        &nbsp;&nbsp;df = df.fillna(df.mean())
        <br />
        <br />
        &nbsp;&nbsp;<span className="code-keyword">return</span> df
        <br />
        <br />
        <span className="code-keyword">if</span> __name__ =={" "}
        <span className="code-string">&quot;__main__&quot;</span>:
        <br />
        &nbsp;&nbsp;result = process_data(
        <span className="code-string">&quot;data.csv&quot;</span>)
        <br />
        &nbsp;&nbsp;print(
        <span className="code-string">
          f&quot;Processed {result.shape[0]} rows&quot;
        </span>
        )
      </CodeBlock>
    </div>
  );
}
