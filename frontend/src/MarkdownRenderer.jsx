import { Children, cloneElement, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock, { normalizeCodeLanguage } from './CodeBlock.jsx';
import InlineCode from './InlineCode.jsx';

const CODE_LABELS = new Map([
  ['code', ''],
  ['code example', ''],
  ['example code', ''],
  ['example', ''],
  ['snippet', ''],
  ['output', ''],
  ['copy', ''],
  ['copy code', ''],
  ['javascript', 'javascript'],
  ['js', 'javascript'],
  ['typescript', 'typescript'],
  ['ts', 'typescript'],
  ['jsx', 'jsx'],
  ['tsx', 'tsx'],
  ['python', 'python'],
  ['py', 'python'],
  ['c++', 'cpp'],
  ['cpp', 'cpp'],
  ['java', 'java'],
  ['json', 'json'],
  ['html', 'markup'],
  ['css', 'css'],
  ['bash', 'bash'],
  ['shell', 'bash'],
  ['sql', 'sql'],
  ['yaml', 'yaml'],
]);

function getNodeText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (node.type === 'break' || node.type === 'html') return '\n';
  return node.children?.map(getNodeText).join('') || '';
}

function getCodeStrength(line) {
  const value = line.trim();
  if (!value) return 'weak';
  if (/^(?:(?:const|let|var)\s+[$\w]+|(?:async\s+)?function\s+\w+|class\s+\w+|interface\s+\w+|type\s+\w+\s*=|import\s+[\w{*]|export\s+(?:default|const|function|class|async)|return\b|throw\b|if\s*\(|else\b|try\s*\{|catch\s*\(|finally\b|for\s*\(|while\s*\(|switch\s*\(|case\b|break;|continue;|new\s+\w+|await\s+[\w(]|module\.exports|require\s*\(|#include\b|using\s+namespace\b|public\s+(?:static|class|void|final)\b|private\s+(?:static|final)\b|def\s+\w+\s*\(|async\s+def\b|from\s+\w+\s+import\b|SELECT\b|INSERT\s+INTO\b|UPDATE\s+\w+\s+SET\b|DELETE\s+FROM\b|CREATE\s+TABLE\b|(?:sudo\s+)?(?:npm|npx|pnpm|yarn|node|python3?|pip3?|curl|wget|git|docker|kubectl|cargo|make|cd|ls|cat|echo|mkdir|touch|chmod|rm|cp|mv|grep|find|ssh|scp)\s)/i.test(value)) return 'strong';
  if (/^(?:\/\/|\/\*|\*\/|#include\b|<!--|-->|--\s)/.test(value)) return 'strong';
  if (/^(?:[.#][\w-]+\s*\{|@media\b|:root\s*\{|<\/?[\w-]+(?:\s|>|\/)|\{|\[|}\s*[;,]?|]\s*[;,]?|\? |:\s|[\w$.]+\s*,?$)/.test(value)) return 'weak';
  if (/^(?:\[['"][^'"]+['"]\s*,|['"][^'"]+['"]\s*:\s*|[\w$.[\]]+\s*=\s*|[\w$.[\]]+\s*\([^)]*\)\s*[;{]?)/.test(value)) return 'strong';
  if (/^(?:[{}[\]();]|=>|<<|>>|\.forEach\b|\.map\b|\.then\b)/.test(value)) return 'weak';
  return 'none';
}

function plainParagraph(node) {
  return node.type === 'paragraph' && node.children.every(child => child.type === 'text' || child.type === 'break');
}

function getCodeLabel(value) {
  const match = value.trim().match(/^(.*?)\s*:?$/);
  if (!match) return null;
  const label = match[1].toLowerCase();
  if (CODE_LABELS.has(label)) return CODE_LABELS.get(label);
  if (/^[\w+#-]+(?:\s+code)?$/.test(label)) return normalizeCodeLanguage(label.replace(/\s+code$/, '')) || null;
  return null;
}

function transformLegacyCode(nodes, sourceLines, lineEnding) {
  const values = nodes.map(node => plainParagraph(node) ? getNodeText(node) : '');
  const strengths = values.map(value => {
    if (!value) return 'none';
    const lines = value.split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return 'none';
    const lineStrengths = lines.map(getCodeStrength);
    if (lineStrengths.every(strength => strength !== 'none')) {
      return lineStrengths.includes('strong') ? 'strong' : 'weak';
    }
    return 'none';
  });
  const output = [];

  for (let index = 0; index < nodes.length;) {
    if (strengths[index] === 'none') {
      const labelLanguage = plainParagraph(nodes[index]) ? getCodeLabel(values[index]) : null;
      if (labelLanguage !== null && strengths[index + 1] !== 'none') {
        index++;
        const code = collectCodeRun(nodes, strengths, values, index, labelLanguage, sourceLines, lineEnding);
        output.push(code.node);
        index = code.nextIndex;
        continue;
      }
      const node = nodes[index];
      if (node.children) node.children = transformLegacyCode(node.children, sourceLines, lineEnding);
      output.push(node);
      index++;
      continue;
    }

    const code = collectCodeRun(nodes, strengths, values, index, '', sourceLines, lineEnding);
    if (code.hasStrongCode) output.push(code.node);
    else output.push(...nodes.slice(index, code.nextIndex));
    index = code.nextIndex;
  }
  return output;
}

function collectCodeRun(nodes, strengths, values, startIndex, language, sourceLines, lineEnding) {
  let endIndex = startIndex;
  let hasStrongCode = false;
  while (endIndex < nodes.length && strengths[endIndex] !== 'none') {
    hasStrongCode ||= strengths[endIndex] === 'strong';
    endIndex++;
  }

  const first = nodes[startIndex];
  const last = nodes[endIndex - 1];
  const startLine = first.position?.start.line;
  const endLine = last.position?.end.line;
  const rawSource = startLine && endLine
    ? sourceLines.slice(startLine - 1, endLine).join(lineEnding)
    : values.slice(startIndex, endIndex).join(lineEnding);
  const normalizedLanguage = normalizeCodeLanguage(language, rawSource);
  return {
    node: {
      type: 'code',
      lang: normalizedLanguage || null,
      meta: null,
      value: rawSource,
      position: first.position && last.position
        ? { start: first.position.start, end: last.position.end }
        : undefined,
    },
    nextIndex: endIndex,
    hasStrongCode,
  };
}

function normalizeCodeNodes(nodes) {
  for (const node of nodes) {
    if (node.type === 'code') node.lang = normalizeCodeLanguage(node.lang, node.value) || 'text';
    if (node.children) normalizeCodeNodes(node.children);
  }
}

function remarkLegacyCodeBlocks(source) {
  const lineEnding = source.match(/\r\n|\n|\r/)?.[0] || '\n';
  const sourceLines = source.split(/\r\n|\n|\r/);
  return tree => {
    if (tree.children) tree.children = transformLegacyCode(tree.children, sourceLines, lineEnding);
    if (tree.children) normalizeCodeNodes(tree.children);
  };
}

function getRenderedText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getRenderedText).join('');
  return isValidElement(node) ? getRenderedText(node.props.children) : '';
}

function getCalloutComponents() {
  return {
    blockquote: ({ children }) => {
      const callout = getRenderedText(children).match(/^\s*\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i)?.[1]?.toLowerCase();
      const blockquoteChildren = callout
        ? Children.map(children, child => {
          if (!isValidElement(child) || typeof child.props.children !== 'string') return child;
          return cloneElement(child, {}, child.props.children.replace(/^\s*\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i, ''));
        })
        : children;
      return <blockquote data-callout={callout || undefined}>
        {callout && <p className="blog-callout-label">{callout}</p>}
        {blockquoteChildren}
      </blockquote>;
    },
  };
}

export default function MarkdownRenderer({ children, components = {} }) {
  const source = String(children ?? '');
  const renderers = {
    pre: ({ children: code }) => <>{code}</>,
    code: ({ className, children: code }) => className
      ? <CodeBlock
        code={getRenderedText(code).replace(/\n$/, '')}
        language={className.match(/language-([\w+#-]+)/)?.[1] || ''}
      />
      : <InlineCode>{code}</InlineCode>,
    ...getCalloutComponents(),
    ...components,
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, [remarkLegacyCodeBlocks, source]]} components={renderers}>
      {source}
    </ReactMarkdown>
  );
}
