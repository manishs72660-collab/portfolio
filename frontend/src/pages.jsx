import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, ArrowLeft, Github, Code2, ExternalLink, Flame, Trophy, LoaderCircle, Play, X } from 'lucide-react';
import { api, arr } from './api.js';
import { TechStack, ProjectCard, Contact, Avatar, Head } from './components.jsx';
import { PROFILE } from './Profile.js';
import { PROJECT_CATEGORIES, sortProjectsByCategory } from './projectCategories.js';

function articleReadingTime(post) {
  if (Number.isFinite(post.readingTime) && post.readingTime > 0) return post.readingTime;
  const words = (post.content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const useGet = (path, init = []) => {
  const [d, setD] = useState(init); const [l, setL] = useState(true); const [err, setErr] = useState('');
  useEffect(() => {
    setL(true); setErr('');
    api(path).then(setD).catch(e => setErr(e.message)).finally(() => setL(false));
  }, [path]);
  return [d, l, err];
};

const useProjects = () => {
  const [data, loading, error] = useGet('/projects');
  return [arr(data), loading, error];
};

// Simple page wrapper
const Wrap = ({ title, sub, children }) => (
  <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
    <header className="mb-12 border-b border-slate-200 pb-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
      {sub && <p className="mt-3 text-slate-500">{sub}</p>}
    </header>
    {children}
  </main>
);

const ROLES = ['Software Engineer', 'Full-Stack Developer', 'AI Enthusiast'];
function Typed() {
  const [i, setI] = useState(0); const [t, setT] = useState(''); const [del, setDel] = useState(false);
  useEffect(() => {
    const w = ROLES[i];
    const id = setTimeout(() => {
      if (!del) { setT(w.slice(0, t.length + 1)); if (t.length + 1 === w.length) setTimeout(() => setDel(true), 1200); }
      else { setT(w.slice(0, t.length - 1)); if (t.length === 1) { setDel(false); setI((i + 1) % ROLES.length); } }
    }, del ? 40 : 90);
    return () => clearTimeout(id);
  }, [t, del, i]);
  return <span className="text-slate-700">{t}<span style={{ animation: 'blink 1s infinite' }}>|</span></span>;
}

export function Home() {
  const [pr] = useGet('/profile', {}); const p = pr?.data || pr || {};
  const [pj, projectsLoading, projectsError] = useProjects();
  return (<>
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#c9ccd9_0%,#dfe1ec_60%,#f4f5f9_100%)] px-6 pb-16 pt-28 md:flex md:min-h-screen md:items-center md:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-[1fr_1.1fr_0.8fr]">

        <div className="relative z-10 order-2 md:order-1">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Hello, I'm <span className="text-slate-600">{p.name || PROFILE.name}</span>
          </h1>
          <h2 className="mt-3 h-8 text-xl font-semibold"><Typed /></h2>
          <p className="mt-4 max-w-sm leading-7 text-slate-700">
            {p.bio || PROFILE.subtitle}
          </p>
          <div className="mt-7 flex gap-3">
            <Link to="/projects" className="btn">View Projects</Link>
            <Link to="/contact" className="btn btn-o">Contact Me</Link>
          </div>
        </div>

        <div className="order-1 mx-auto h-[340px] w-full max-w-sm md:order-2 md:h-[540px]">
          <Avatar />
        </div>

        <div className="relative z-10 order-3 mx-auto w-full max-w-xs rounded-2xl border border-white/80 bg-white/30 p-5 backdrop-blur">
          {[
            ['Problem Solving', 'Strategist'],
            ['Projects', projectsLoading ? 'Loading...' : `${pj.length} Projects`],
            ['DSA Practice', '500+ Problems'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-white/60 py-3 last:border-0">
              <span className="text-sm text-slate-600">{label}</span>
              <span className="text-right text-sm font-bold text-slate-900">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-xs">
            <span className="text-slate-500">Availability</span>
            <span className="flex items-center gap-1.5 font-semibold text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Open to Opportunities
            </span>
          </div>
        </div>
      </motion.div>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">A little about me</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">{PROFILE.headline}</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          I’m {PROFILE.name}, a BCA student from {PROFILE.location}. I enjoy building full-stack applications, exploring AI-powered systems, optimizing databases, and learning how to make software reliable and scalable.
        </p>
        <Link to="/education" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
          More about my background <ArrowRight size={15} />
        </Link>
      </div>
    </section>

    <TechStack />

    <section className="mx-auto max-w-6xl px-6 py-20">
      <Head title="My Work" sub="Explore my latest projects and creations" />
      {projectsLoading ? <p className="text-slate-500">Loading projects...</p>
        : projectsError ? <p role="status" className="text-red-600">{projectsError}</p>
          : pj.length === 0 ? <p className="text-slate-500">No published projects are available yet.</p>
            : <div className="grid gap-6 md:grid-cols-3">
              {sortProjectsByCategory(pj).slice(0, 3).map((x, i) => <ProjectCard key={x._id || x.slug} p={x} i={i} />)}
            </div>}
      <div className="mt-12 text-center">
        <Link to="/projects" className="btn btn-o">See all projects <ArrowRight size={16} /></Link>
      </div>
    </section>

    <Contact />
  </>);
}

export function Projects() {
  const [pj, l, error] = useProjects(); const [q, setQ] = useState(''); const [category, setCategory] = useState('All');
  const categories = ['All', ...[...PROJECT_CATEGORIES, ...pj.map(project => project.category).filter(Boolean)]
    .filter((item, index, items) => items.findIndex(value => value.toLowerCase() === item.toLowerCase()) === index)];
  const list = sortProjectsByCategory(pj
    .filter(x =>
      (category === 'All' || x.category?.toLowerCase() === category.toLowerCase())
      && (x.title + (x.technologies || x.techStack || []).join()).toLowerCase().includes(q.toLowerCase()),
    ));
  return <Wrap title="Projects" sub="Things I've built and shipped">
    <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter projects by category">
      {categories.map(item => (
        <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${category === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'}`}>
          {item}
        </button>
      ))}
    </div>
    <input className="inp mb-8 max-w-sm" placeholder="Search projects or tech..." value={q} onChange={e => setQ(e.target.value)} />
    {l ? <p className="text-slate-500">Loading projects...</p>
      : error ? <p role="status" className="text-red-600">{error}</p>
        : list.length === 0 ? <p className="text-slate-500">{pj.length ? 'No projects match your search.' : 'No published projects are available yet.'}</p>
      : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((x, i) => <ProjectCard key={x._id || x.slug} p={x} i={i} />)}</div>}
  </Wrap>;
}

export function ProjectDetail() {
  const { id } = useParams();
  const [d, loading, error] = useGet(`/projects/${id}`, {});
  const p = d?.data || d;
  const live = p.liveDemoUrl || p.liveUrl || p.liveLink;
  const gh = p.githubUrl || p.repositoryUrl || p.githubLink;
  const image = p.imageUrl || p.thumbnail || p.image || p.coverImageUrl;
  const technologies = p.technologies || p.techStack || [];
  const [imageFailed, setImageFailed] = useState(false);
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  if (loading) return <Wrap title="Loading project..." sub="Fetching project details" />;
  if (error) return <Wrap title="Project unavailable" sub={error}>
    <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"><ArrowLeft size={14} /> Back to projects</Link>
  </Wrap>;

  return <Wrap title={p.title || 'Project'} sub={p.category || 'Project details'}>
    <Link to="/projects" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"><ArrowLeft size={14} /> Back to projects</Link>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex min-h-56 max-h-[34rem] items-center justify-center overflow-hidden bg-slate-900">
        {image && !imageFailed
          ? <img src={image} alt={`${p.title} preview`} onError={() => setImageFailed(true)} className="max-h-[34rem] w-full object-cover" />
          : <div className="flex min-h-56 w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#a3e63522,transparent_60%)] font-display text-9xl font-bold text-white/15">{p.title?.[0]}</div>}
        <span className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">{p.category || 'Project'}</span>
        {p.isFeatured && <span className="absolute right-5 top-5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-950">Featured</span>}
      </div>
      <div className="p-6 md:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{p.title}</h2>
            {p.createdAt && <p className="mt-2 text-sm text-slate-500">Added {new Date(p.createdAt).toLocaleDateString()}</p>}
          </div>
          {(live || gh || p.demoVideoUrl) && <div className="flex flex-wrap gap-3">
            {p.demoVideoUrl && <button type="button" className="btn" aria-expanded={showDemoVideo} aria-controls="project-demo-video" onClick={() => setShowDemoVideo(!showDemoVideo)}>
              {showDemoVideo ? <X size={15} /> : <Play size={15} />}
              {showDemoVideo ? 'Close Demo' : 'Watch Demo'}
            </button>}
            {live && <a className="btn" href={live} target="_blank" rel="noreferrer">Live Demo <ExternalLink size={15} /></a>}
            {gh && <a className="btn btn-o" href={gh} target="_blank" rel="noreferrer"><Github size={15} /> GitHub <ExternalLink size={14} /></a>}
          </div>}
        </div>
        {showDemoVideo && p.demoVideoUrl && <div id="project-demo-video" className="mt-7 overflow-hidden rounded-2xl bg-slate-950">
          <video src={p.demoVideoUrl} controls autoPlay playsInline preload="metadata" aria-label={`${p.title} demo video`} className="aspect-video w-full" />
        </div>}
        {technologies.length > 0 && <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Built with</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {technologies.map(technology => <span key={technology} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">{technology}</span>)}
          </div>
        </div>}
        <div className="mt-7 border-t border-slate-200 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">About this project</h3>
          <p className="mt-3 max-w-4xl whitespace-pre-line leading-8 text-slate-600">{p.description || p.content || 'No project description is available.'}</p>
        </div>
      </div>
    </section>
  </Wrap>;
}

export function Blog() {
  const [d, l, err] = useGet('/blogs');
  const posts = arr(d);
  return <Wrap title="Engineering notes" sub="Practical ideas, systems, and lessons from building software.">
    {l ? <p className="text-slate-500">Loading...</p>
      : err ? <p className="text-red-600">Unable to load blog posts: {err}</p>
      : posts.length === 0 ? <p className="text-slate-500">No published blog posts yet.</p>
      : <div className="divide-y divide-slate-200 border-y border-slate-200">
        {posts.map(b => (
          <Link key={b._id} to={`/blog/${b.slug}`} className="group grid min-w-0 gap-5 py-7 transition-colors hover:bg-white/70 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center sm:px-5">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                {(b.publishedAt || b.createdAt) && <time dateTime={b.publishedAt || b.createdAt}>{new Date(b.publishedAt || b.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>}
                <span>{articleReadingTime(b)} min read</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-slate-600 sm:text-2xl">{b.title}</h2>
              <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-slate-600">{b.excerpt || b.content}</p>
              {!!b.tags?.length && <ul className="mt-4 flex flex-wrap gap-2" aria-label="Article tags">
                {b.tags.slice(0, 4).map(tag => <li key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</li>)}
              </ul>}
            </div>
            {(b.coverImageUrl || b.coverImage) && <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-100 sm:aspect-[4/3]">
              <img src={b.coverImageUrl || b.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            </div>}
            <span className="sr-only">Read {b.title}</span>
          </Link>
        ))}
      </div>}
  </Wrap>;
}

const LazyBlogArticle = lazy(() => import('./BlogArticle.jsx'));
export function BlogPost() {
  return <Suspense fallback={<main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-6"><p className="text-slate-500">Loading article...</p></main>}>
    <LazyBlogArticle />
  </Suspense>;
}

export function Education() {
  const education = PROFILE.education;
  const [statsResponse, statsLoading, statsError] = useGet('/stats', {});
  const stats = statsResponse?.data || {};
  return <Wrap title="Education" sub="My academic journey">
    <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <GraduationCap size={23} />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-slate-500">Currently pursuing</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{education.degree}</h2>
        <p className="mt-4 text-lg font-medium text-slate-700">{education.institute}</p>
        <p className="mt-1 text-sm text-slate-500">{education.university}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{education.graduation}</span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{education.location}</span>
        </div>
      </article>
      <aside className="rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white shadow-sm md:p-9">
        <p className="text-sm font-medium text-slate-300">Academic snapshot</p>
        <p className="mt-3 text-4xl font-bold">{education.cgpa}</p>
        <p className="mt-2 text-sm text-slate-400">CGPA previously reported; current value to be verified.</p>
        <div className="mt-8 border-t border-white/15 pt-6">
          <h3 className="font-semibold">Areas of focus</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {education.interests.slice(0, 5).map(item => (
              <li key={item} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300">{item}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-slate-900">Certificates</h2>
      <p className="mt-2 text-slate-500">A certificate from my learning journey.</p>
      <a
        href="/certificate.png"
        target="_blank"
        rel="noreferrer"
        className="mt-6 block overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
        aria-label="Open certificate image in a new tab"
      >
        <img src="/certificate.png" alt="Certificate" className="mx-auto max-h-[32rem] w-full object-contain" />
      </a>
    </section>
    <section className="mt-16">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Practice & open source</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Coding Activity</h2>
        <p className="mt-2 text-slate-500">A live snapshot of my LeetCode practice and GitHub contributions.</p>
      </header>
      {statsLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
          <LoaderCircle size={18} className="animate-spin" /> Loading coding activity...
        </div>
      ) : statsError ? (
        <p role="status" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load coding activity: {statsError}
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CodingActivityCard
            title="GitHub"
            icon={<Github size={20} />}
            profile={stats.github}
            metrics={[
              ['Public repos', stats.github?.publicRepos],
              ['Followers', stats.github?.followers],
              ['Following', stats.github?.following],
            ]}
            accent="emerald"
          />
          <CodingActivityCard
            title="LeetCode"
            icon={<Code2 size={20} />}
            profile={stats.leetcode}
            metrics={[
              ['Problems solved', stats.leetcode?.solved],
              ['Active days', stats.leetcode?.activeDays],
              ['Current streak', stats.leetcode?.streak],
            ]}
            accent="amber"
          />
        </div>
      )}
    </section>
  </Wrap>;
}

function CodingActivityCard({ title, icon, profile, metrics, accent }) {
  const accentClasses = accent === 'emerald'
    ? { icon: 'bg-emerald-50 text-emerald-700', link: 'text-emerald-700' }
    : { icon: 'bg-amber-50 text-amber-700', link: 'text-amber-700' };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${accentClasses.icon}`}>{icon}</span>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {profile?.username && <p className="text-sm text-slate-500">@{profile.username}</p>}
          </div>
        </div>
        {profile?.profileUrl && (
          <a href={profile.profileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${title} profile`} className={`rounded-full p-2 hover:bg-slate-100 ${accentClasses.link}`}>
            <ExternalLink size={17} />
          </a>
        )}
      </div>
      {profile?.error ? (
        <p role="status" className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{profile.error}</p>
      ) : profile ? (
        <>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{Number(value || 0).toLocaleString()}</p>
                <p className="mt-1 text-xs leading-tight text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          {profile.difficulty && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(profile.difficulty).map(([difficulty, count]) => (
                <span key={difficulty} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                  {difficulty}: {count}
                </span>
              ))}
              {profile.ranking > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <Trophy size={13} /> Rank {Number(profile.ranking).toLocaleString()}
                </span>
              )}
            </div>
          )}
          <ActivityHeatmap
            title={title === 'GitHub' ? 'Contributions' : 'Submissions'}
            heatmap={profile.heatmap}
            accent={accent}
          />
        </>
      ) : (
        <p role="status" className="mt-6 text-sm text-slate-500">Profile data is not available.</p>
      )}
    </article>
  );
}

function ActivityHeatmap({ title, heatmap, accent }) {
  const contributions = heatmap?.contributions || [];
  const dayMap = new Map(contributions.map(day => [day.date, day.count]));
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 363);
  start.setDate(start.getDate() - start.getDay());
  const days = [];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    days.push({ key, count: dayMap.get(key) || 0 });
  }

  const max = Math.max(1, ...days.map(day => day.count));
  const colors = accent === 'emerald'
    ? ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-500', 'bg-emerald-700']
    : ['bg-slate-100', 'bg-amber-200', 'bg-amber-300', 'bg-amber-500', 'bg-amber-700'];
  const level = count => count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
  const weekCount = Math.ceil(days.length / 7);

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700"><Flame size={14} /> {title}</span>
        <span>{Number(heatmap?.total || 0).toLocaleString()} in the past year</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1" aria-label={`${title} activity over the past year`}>
          {Array.from({ length: weekCount * 7 }, (_, index) => {
            const day = days[index];
            return day ? (
              <span
                key={day.key}
                title={`${day.key}: ${day.count}`}
                aria-label={`${day.key}: ${day.count}`}
                className={`h-3 w-3 rounded-[3px] ${colors[level(day.count)]}`}
              />
            ) : <span key={`empty-${index}`} className="h-3 w-3" aria-hidden="true" />;
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
        <span>Less</span>
        {colors.map(color => <span key={color} className={`h-3 w-3 rounded-[3px] ${color}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}