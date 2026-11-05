import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Clock3, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { api } from './api.js';

const codeLanguages = {
  javascript,
  js: javascript,
  typescript,
  ts: typescript,
  jsx,
  tsx,
  python,
  py: python,
  cpp,
  'c++': cpp,
  json,
  bash,
  sh: bash,
  shell: bash,
  yaml,
  yml: yaml,
  sql,
  html: markup,
  xml: markup,
  markup,
};
Object.entries(codeLanguages).forEach(([name, language]) => SyntaxHighlighter.registerLanguage(name, language));

const codeTheme = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.8125rem',
    lineHeight: '1.8',
    whiteSpace: 'pre',
  },
  'pre[class*="language-"]': { margin: 0, background: 'transparent', overflow: 'visible' },
  comment: { color: '#94a3b8', fontStyle: 'italic' },
  keyword: { color: '#c4b5fd' },
  string: { color: '#86efac' },
  function: { color: '#7dd3fc' },
  number: { color: '#fbbf24' },
  boolean: { color: '#fbbf24' },
  operator: { color: '#f8fafc' },
  punctuation: { color: '#cbd5e1' },
  property: { color: '#7dd3fc' },
  'class-name': { color: '#67e8f9' },
};

const languageLabels = {
  javascript: 'JavaScript', js: 'JavaScript', typescript: 'TypeScript', ts: 'TypeScript',
  jsx: 'JSX', tsx: 'TSX', python: 'Python', py: 'Python', cpp: 'C++', 'c++': 'C++',
  json: 'JSON', bash: 'Bash', sh: 'Shell', shell: 'Shell', yaml: 'YAML', yml: 'YAML',
  sql: 'SQL', html: 'HTML', xml: 'XML', markup: 'Markup',
};

function MarkdownCode({ className = '', children, isBlock = false }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const source = String(children).replace(/\n$/, '');
  const language = className.match(/language-([\w+#-]+)/)?.[1]?.toLowerCase() || '';

  if (!isBlock) return <code className="blog-inline-code">{children}</code>;

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
  const lines = source.split('\n');

  return (
    <div className="blog-code-block">
      <div className="blog-code-toolbar">
        <span className="blog-code-language">{languageLabels[language] || (language ? language.toUpperCase() : 'Code')}</span>
        <div className="flex items-center gap-3">
          {copyError && <span className="text-xs text-rose-300" role="status">{copyError}</span>}
          <button type="button" onClick={copyCode} className="blog-copy-button" aria-label={copied ? 'Code copied' : 'Copy code'}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <div className="blog-code-scroll">
        {codeLanguages[language] ? (
          <SyntaxHighlighter
            language={language}
            style={codeTheme}
            showLineNumbers
            lineNumberStyle={{ color: '#64748b', minWidth: '2.75rem', paddingRight: '1rem', textAlign: 'right' }}
            customStyle={{ margin: 0, padding: '1rem 1.25rem', background: 'transparent' }}
            codeTagProps={{ style: { fontFamily: 'inherit' } }}
          >
            {source}
          </SyntaxHighlighter>
        ) : (
          <pre className="blog-plain-code" aria-label="Code snippet">
            {lines.map((line, index) => <span className="blog-plain-code-line" key={index}>{line || ' '}</span>)}
          </pre>
        )}
      </div>
    </div>
  );
}

function getArticleHeadings(content) {
  const seen = new Map();
  let fence = '';
  return content.split(/\r?\n/).flatMap(line => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = '';
      return [];
    }
    if (fence) return [];
    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) return [];
    const title = match[2]
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~]/g, '')
      .trim();
    const baseId = title.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'section';
    const occurrence = seen.get(baseId) || 0;
    seen.set(baseId, occurrence + 1);
    return [{ title, level: match[1].length, id: occurrence ? `${baseId}-${occurrence + 1}` : baseId }];
  });
}

function articleReadingTime(post) {
  if (Number.isFinite(post.readingTime) && post.readingTime > 0) return post.readingTime;
  const words = (post.content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getText).join('');
  return isValidElement(node) ? getText(node.props.children) : '';
}

function useBlogPost(slug) {
  const [post, setPost] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api(`/blogs/${slug}`)
      .then(result => setPost(result?.data || result))
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { post, loading, error };
}

export default function BlogArticle() {
  const { slug } = useParams();
  const { post: b, loading, error } = useBlogPost(slug);
  if (loading) {
    return <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-6"><p className="text-slate-500">Loading article...</p></main>;
  }
  if (error) {
    return <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-6"><h1 className="text-3xl font-bold text-slate-900">Blog post unavailable</h1><p className="mt-3 text-slate-500">{error}</p></main>;
  }

  const content = b.content || '';
  const headings = getArticleHeadings(content);
  let headingIndex = 0;
  const articleComponents = {
    pre: ({ children }) => Children.map(children, child => isValidElement(child) ? cloneElement(child, { isBlock: true }) : child),
    code: MarkdownCode,
    blockquote: ({ children }) => {
      const callout = getText(children).match(/^\s*\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i)?.[1]?.toLowerCase();
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
    h2: ({ children }) => {
      const heading = headings[headingIndex++];
      return <h2 id={heading?.id} className="scroll-mt-28">{children}</h2>;
    },
    h3: ({ children }) => {
      const heading = headings[headingIndex++];
      return <h3 id={heading?.id} className="scroll-mt-28">{children}</h3>;
    },
  };
  const publishedDate = b.publishedAt || b.createdAt;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-6">
      <header className="mx-auto max-w-3xl border-b border-slate-200 pb-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
          <ArrowLeft size={15} /> All articles
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          {publishedDate && <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> <time dateTime={publishedDate}>{new Date(publishedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time></span>}
          <span className="inline-flex items-center gap-2"><Clock3 size={15} /> {articleReadingTime(b)} min read</span>
        </div>
        <h1 className="mt-5 break-words text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl md:text-[3.5rem]">{b.title || 'Untitled article'}</h1>
        {b.excerpt && <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{b.excerpt}</p>}
        {!!b.tags?.length && <ul className="mt-6 flex flex-wrap gap-2" aria-label="Article tags">
          {b.tags.map(tag => <li key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">{tag}</li>)}
        </ul>}
      </header>

      {(b.coverImageUrl || b.coverImage) && <img src={b.coverImageUrl || b.coverImage} alt={b.title || ''} className="mx-auto mt-8 max-h-[34rem] w-full max-w-5xl rounded-2xl border border-slate-200 object-cover" />}

      <div className={`mx-auto mt-10 grid min-w-0 gap-10 ${headings.length > 2 ? 'max-w-6xl lg:grid-cols-[minmax(0,1fr)_14rem]' : 'max-w-3xl'}`}>
        <article className="blog-prose min-w-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={articleComponents}>{content}</ReactMarkdown>
        </article>
        {headings.length > 2 && <aside className="min-w-0 lg:order-last">
          <nav aria-label="Table of contents" className="lg:sticky lg:top-28">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">On this page</h2>
            <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4">
              {headings.map(heading => <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
                <a href={`#${heading.id}`} className="text-sm leading-6 text-slate-500 transition-colors hover:text-slate-950">{heading.title}</a>
              </li>)}
            </ol>
          </nav>
        </aside>}
      </div>
    </main>
  );
}
