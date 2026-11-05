import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

const languages = {
  javascript,
  typescript,
  jsx,
  tsx,
  python,
  cpp,
  java,
  json,
  markup,
  css,
  bash,
  sql,
  yaml,
};

Object.entries(languages).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

const aliases = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  node: 'javascript',
  nodejs: 'javascript',
  ts: 'typescript',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  py: 'python',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
};

const labels = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  json: 'JSON',
  markup: 'HTML',
  css: 'CSS',
  bash: 'Bash',
  sql: 'SQL',
  yaml: 'YAML',
};

const editorTheme = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.8125rem',
    lineHeight: '1.8',
    whiteSpace: 'pre',
  },
  'pre[class*="language-"]': { margin: 0, background: 'transparent', overflow: 'visible' },
  comment: { color: '#94a3b8', fontStyle: 'italic' },
  keyword: { color: '#c4b5fd' },
  string: { color: '#86efac' },
  function: { color: '#7dd3fc' },
  builtin: { color: '#67e8f9' },
  constant: { color: '#fbbf24' },
  number: { color: '#fb923c' },
  boolean: { color: '#fbbf24' },
  operator: { color: '#f8fafc' },
  punctuation: { color: '#cbd5e1' },
  property: { color: '#7dd3fc' },
  'class-name': { color: '#67e8f9' },
  selector: { color: '#c4b5fd' },
};

export function detectCodeLanguage(source) {
  const code = source.trim().split(/\r?\n/).map(line => line.trim()).join('\n');
  if (!code) return '';

  if (/^(?:#!.*\b(?:bash|sh)|(?:sudo\s+)?(?:npm|npx|pnpm|yarn|node|python3?|pip3?|git|docker|kubectl|curl|wget|make|cargo|go|cd|ls|cat|echo|mkdir|touch|chmod|rm|cp|mv|grep|find|ssh|scp)\s)\b/m.test(code)) return 'bash';
  if (/^(?:SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/im.test(code)) return 'sql';
  if (/^(?:#include\b|using\s+namespace\s+std;|std::|int\s+main\s*\()/m.test(code)) return 'cpp';
  if (/^(?:package\s+[\w.]+;|import\s+[\w.]+;|public\s+(?:final\s+)?class\b|public\s+static\s+void\s+main\b)/m.test(code) || /\bSystem\.out\./.test(code)) return 'java';
  if (/^(?:async\s+def|def\s+\w+\s*\(|from\s+\w+\s+import\s|if\s+__name__\s*==)/m.test(code) || /\bself\.\w+/.test(code)) return 'python';
  if (/^(?:<!doctype\s+html|<html\b|<(?:div|main|section|article|head|body|script|style|svg)\b)/im.test(code)) return 'markup';
  if (/^(?:[.#][\w-]+\s*\{|@media\b|:root\s*\{)|^\s*[\w-]+\s*:\s*[^;\n]+;/m.test(code) && /[{}]/.test(code)) return 'css';
  if (/^\s*\{\s*$/m.test(code) && /"[^"\n]+"\s*:\s*(?:"|true\b|false\b|null\b|-?\d|[{\[])/m.test(code) && !/\b(?:const|let|var|function)\b/.test(code)) return 'json';
  if (/<(?:[A-Z][\w.]*(?:\s|>)|[a-z][\w-]*(?:\s|\/?>))/.test(code) && /\/?>/.test(code)) return /\b(?:interface|type)\s+\w+/.test(code) ? 'tsx' : 'jsx';
  if (/\b(?:interface|type)\s+\w+|\b(?:const|let|function)\s+\w+\s*:\s*[\w[{]/.test(code)) return 'typescript';
  if (/^(?:const|let|var|function|async\s+function|import\s|export\s|module\.exports|require\s*\(|class\s+\w+|return\b|await\b|if\s*\(|try\s*\{|for\s*\()/m.test(code) || /\bcatch\s*\(|=>/.test(code) || /\b[\w$]+\.[\w$]+\s*\(/.test(code) || /^[a-z_$][\w$]*[A-Z]\w*\s*\(/.test(code)) return 'javascript';
  if (/^\s*[\w.-]+\s*:\s*(?:$|[^\s].*)/m.test(code) && /^(?:[\w.-]+\s*:|-\s+)/m.test(code)) return 'yaml';
  return '';
}

export function normalizeCodeLanguage(language, source = '') {
  const name = String(language || '').trim().toLowerCase().split(/[\s,;]+/, 1)[0].replace(/^language-/, '');
  const normalized = aliases[name] || name;
  return Object.hasOwn(languages, normalized) ? normalized : detectCodeLanguage(source);
}

export function getLanguageLabel(language) {
  return labels[language] || (language ? language.toUpperCase() : 'Plain text');
}

export default function CodeBlock({ code, language = '' }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const source = String(code);
  const normalizedLanguage = normalizeCodeLanguage(language, source);
  const lineCount = source.split('\n').length;

  const copyCode = async () => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      setCopyError(error instanceof Error ? 'Copy unavailable in this browser.' : 'Unable to copy code.');
    }
  };

  return (
    <div className="blog-code-block">
      <div className="blog-code-toolbar">
        <span className="blog-code-language">{getLanguageLabel(normalizedLanguage)}</span>
        <div className="flex items-center gap-3">
          {copyError && <span className="text-xs text-rose-300" role="status">{copyError}</span>}
          <button type="button" onClick={copyCode} className="blog-copy-button" aria-label={copied ? 'Code copied' : 'Copy code'}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy code'}</span>
          </button>
        </div>
      </div>
      <div className="blog-code-scroll">
        {normalizedLanguage ? (
          <SyntaxHighlighter
            language={normalizedLanguage}
            style={editorTheme}
            showLineNumbers
            wrapLongLines={false}
            lineNumberStyle={{
              position: 'sticky',
              left: 0,
              zIndex: 1,
              minWidth: `${Math.max(2.5, String(lineCount).length * 0.65 + 1.5)}rem`,
              paddingRight: '1rem',
              background: '#0b1220',
              color: '#64748b',
              textAlign: 'right',
            }}
            customStyle={{ margin: 0, padding: '1rem 1.25rem', background: 'transparent' }}
            codeTagProps={{ style: { fontFamily: 'inherit' } }}
          >
            {source}
          </SyntaxHighlighter>
        ) : (
          <pre className="blog-plain-code" aria-label="Code snippet">
            {source.split('\n').map((line, index) => <span className="blog-plain-code-line" key={index}>{line || ' '}</span>)}
          </pre>
        )}
      </div>
    </div>
  );
}
