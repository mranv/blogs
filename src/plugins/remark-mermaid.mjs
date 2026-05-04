import { visit } from 'unist-util-visit';

export function remarkMermaid() {
	return (tree) => {
		visit(tree, 'code', (node, index, parent) => {
			if (node.lang !== 'mermaid') return;

			const escaped = node.value
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');

			parent.children.splice(index, 1, {
				type: 'html',
				value: `<div class="mermaid-diagram-wrapper not-prose">\n<pre class="mermaid">${escaped}</pre>\n</div>`,
			});

			return index;
		});
	};
}
