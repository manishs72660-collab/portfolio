import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';
import { api } from './api.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';

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
          <MarkdownRenderer components={articleComponents}>{content}</MarkdownRenderer>
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
