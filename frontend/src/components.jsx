import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, animate, useInView, AnimatePresence } from 'framer-motion';
import { Code2, Github, Linkedin, Mail, ArrowUpRight, Menu, X, Send } from 'lucide-react';
import { api } from './api.js';
import { PROFILE } from './Profile.js';

export const SOCIAL = PROFILE.social;
const links = [['Home', '/'], ['Blog', '/blog'], ['Projects', '/projects'], ['Education', '/education'], ['Contact', '/contact'], ['Admin', '/admin']];
const EASE = [0.22, 1, 0.36, 1];

export const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease: EASE }}>{children}</motion.div>
);

export const Head = ({ tag, title, sub }) => (
  <Reveal className="mb-12 text-center">
    {tag && <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
      <span className="h-px w-8 bg-slate-300" />{tag}<span className="h-px w-8 bg-slate-300" />
    </span>}
    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h2>
    <motion.span
      initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      className="mx-auto mt-4 block h-[3px] w-16 rounded-full bg-slate-900" />
    {sub && <p className="mx-auto mt-4 max-w-lg text-sm text-slate-500">{sub}</p>}
  </Reveal>
);

export function Navbar() {
  const [open, setOpen] = useState(false); const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE }} className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-2.5 shadow-lg shadow-slate-900/5 backdrop-blur">
        <Link to="/" aria-label="Manish Singh home" className="group flex shrink-0 items-center gap-1.5 font-display text-sm font-bold text-slate-900 sm:text-base">
          <Code2 size={16} strokeWidth={2.5} className="shrink-0 text-acc transition-transform duration-500 group-hover:rotate-[360deg]" />
          <span>Manish Singh</span>
        </Link>
        <div className="hidden gap-1 md:flex">
          {links.map(([n, p]) => (
            <NavLink key={p} to={p} end={p === '/'} className="relative rounded-full px-4 py-1.5 text-sm text-slate-500 transition hover:text-slate-900">
              {({ isActive }) => <>{isActive && <motion.span layoutId="pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="absolute inset-0 rounded-full bg-slate-900/10" />}<span className={`relative ${isActive ? 'font-semibold text-slate-900' : ''}`}>{n}</span></>}
            </NavLink>
          ))}
        </div>
        <div className="hidden gap-3 text-slate-500 md:flex">
          {[[SOCIAL.github, Github], [SOCIAL.linkedin, Linkedin], [`mailto:${SOCIAL.email}`, Mail]].map(([h, I], i) => <a key={i} href={h} target="_blank" rel="noreferrer" aria-label={['GitHub', 'LinkedIn', 'Email'][i]} className="transition hover:-translate-y-0.5 hover:text-slate-900"><I size={16} /></a>)}
        </div>
        <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </nav>
      <AnimatePresence>{open && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass absolute top-16 w-[calc(100%-2rem)] rounded-2xl p-4 shadow-xl md:hidden">
          {links.map(([n, p], i) => (
            <motion.div key={p} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={p} className="block rounded-lg px-3 py-2.5 transition hover:bg-slate-100">{n}</Link>
            </motion.div>
          ))}
        </motion.div>)}
      </AnimatePresence>
    </motion.header>
  );
}

export function Avatar() {
  const [err, setErr] = useState(false);
  if (!err) return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-[88%] max-h-[480px] w-[min(78%,340px)]"
      >
        <div className="absolute inset-2 rounded-[48%_48%_2.5rem_2.5rem] bg-gradient-to-br from-sky-300/40 via-indigo-400/25 to-violet-400/35 blur-xl" />
        <div className="absolute inset-0 rounded-[48%_48%_2.5rem_2.5rem] border border-white/40" />
        <div className="absolute inset-0 overflow-hidden rounded-[48%_48%_2.5rem_2.5rem] border border-white/60 bg-white/10 p-2 shadow-[0_30px_80px_-25px_rgba(49,46,129,0.55)] backdrop-blur-sm">
          <img
            src="https://i.pinimg.com/736x/7e/35/3f/7e353fb5f0e662d5d6c55cd9302d366d.jpg"
            alt="Developer portrait"
            onError={() => setErr(true)}
            className="h-full w-full rounded-[inherit] object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-2 rounded-[inherit] bg-gradient-to-t from-slate-950/40 via-transparent to-white/10" />
        </div>
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-3 top-[16%] max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/40 bg-zinc-900/80 px-3 py-2 shadow-lg backdrop-blur"
        >
          <span className="text-xs font-bold leading-tight text-white sm:text-sm">Full-Stack Systems Engineer</span>
        </motion.div>
        <motion.div
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[12%] left-3 flex items-center gap-2 rounded-2xl border border-white/40 bg-zinc-900/85 px-3 py-2 shadow-lg backdrop-blur"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <span className="text-xs font-semibold text-white">Open to Opportunities</span>
        </motion.div>
      </motion.div>
    </div>
  );
  return (
    <svg viewBox="0 0 400 420" className="h-full w-full">
      <circle cx="200" cy="215" r="175" fill="none" stroke="#a3e635" strokeOpacity=".3" strokeDasharray="3 10" className="spin-slow" style={{ transformOrigin: '200px 215px' }} />
      <circle cx="200" cy="215" r="130" fill="#a3e635" fillOpacity=".06" />
      <ellipse cx="200" cy="392" rx="140" ry="12" fill="#a3e635" opacity=".18" />
      <path d="M105 392C105 300 145 262 200 262S295 300 295 392Z" fill="#27272a" stroke="#3f3f46" />
      <rect x="182" y="228" width="36" height="40" rx="12" fill="#d4d4d8" />
      <circle cx="200" cy="175" r="58" fill="#e4e4e7" />
      <path d="M140 170C136 105 190 92 218 102C258 108 264 145 260 172C242 146 198 140 140 170Z" fill="#18181b" stroke="#52525b" />
      <circle cx="178" cy="182" r="15" fill="#0c0c0f" fillOpacity=".15" stroke="#18181b" strokeWidth="4" />
      <circle cx="224" cy="182" r="15" fill="#0c0c0f" fillOpacity=".15" stroke="#18181b" strokeWidth="4" />
      <path d="M193 182h16M186 214q14 12 28 0" stroke="#18181b" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M215 345l95 -22 25 62h-130z" fill="#18181b" stroke="#a3e635" strokeWidth="2" />
      <path d="M232 360l60-14" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <g className="float" style={{ transformOrigin: '320px 85px' }}>
        <rect x="270" y="55" width="100" height="56" rx="18" fill="#a3e635" /><path d="M285 108l-12 22 30-14z" fill="#a3e635" />
        <text x="320" y="92" textAnchor="middle" fontSize="28" fontWeight="800" fill="#09090b" fontFamily="Space Grotesk">HI!</text>
      </g>
    </svg>
  );
}

export function Counter({ to, suffix = '' }) {
  const ref = useRef(); const inV = useInView(ref, { once: true }); const [v, setV] = useState(0);
  useEffect(() => { if (inV) animate(0, to, { duration: 2, onUpdate: x => setV(Math.round(x)) }); }, [inV, to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

const D = (n, v = 'original') => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${n}/${n}-${v}.svg`;
const S = n => `https://cdn.simpleicons.org/${n}`;
export const TECH = [
  ['Frontend', 'React', 'UI library', D('react')], ['Frontend', 'Next.js', 'React framework', D('nextjs')],
  ['Frontend', 'JavaScript', 'Language of the web', D('javascript')], ['Frontend', 'TypeScript', 'Typed JavaScript', D('typescript')],
  ['Frontend', 'HTML5', 'Markup', D('html5')], ['Frontend', 'CSS3', 'Styling', D('css3')],
  ['Frontend', 'Tailwind CSS', 'Utility-first CSS', D('tailwindcss')], ['Frontend', 'Redux', 'State management', D('redux')],
  ['Backend', 'Node.js', 'JS runtime', D('nodejs')], ['Backend', 'Express.js', 'Web framework', D('express')],
  ['Backend', 'JWT', 'Authentication', 'https://cdn.jsdelivr.net/npm/simple-icons@11/icons/jsonwebtokens.svg'], ['Backend', 'REST API', 'API design', D('fastapi')],
  ['Database', 'MongoDB', 'NoSQL database', D('mongodb')], ['Database', 'Mongoose', 'MongoDB ODM', D('mongoose')],
  ['Database', 'Supabase', 'Open-source backend platform', S('supabase')],
  ['Tools', 'Git', 'Version control', D('git')], ['Tools', 'GitHub', 'Code hosting', D('github')],
  ['Tools', 'Postman', 'API testing', D('postman')], ['Tools', 'Vite', 'Build tool', D('vitejs')],
  ['Tools', 'Docker', 'Containers', D('docker')], ['Tools', 'Vercel', 'Deployment', D('vercel')],
  ['Tools', 'Nginx', 'Web server and reverse proxy', S('nginx')],
  ['Tools', 'Grafana', 'Observability and dashboards', S('grafana')],
  ['AI', 'LangChain', 'LLM application framework', S('langchain')],
  ['AI', 'LangGraph', 'Stateful agent workflows', S('langgraph')],
];

// Mouse ke saath chalne wali spotlight ke liye position set karta hai
const spot = e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--x', e.clientX - r.left + 'px'); e.currentTarget.style.setProperty('--y', e.clientY - r.top + 'px'); };
const Spotlight = ({ size = 220, alpha = 0.07 }) => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    style={{ background: `radial-gradient(${size}px circle at var(--x,50%) var(--y,50%), rgba(15,23,42,${alpha}), transparent 70%)` }} />
);

export const Marquee = ({ rev }) => (
  <div className="overflow-hidden border-y border-slate-200 py-4">
    <div className={`marquee ${rev ? 'rev' : ''}`}>
      {[...TECH, ...TECH].map(([, n], i) => <span key={i} className="mx-6 whitespace-nowrap font-display text-xl text-slate-400">{n} <span className="ml-6 text-slate-900">✦</span></span>)}
    </div>
  </div>
);

export function TechStack() {
  const cats = ['All', 'Frontend', 'Backend', 'Database', 'Tools', 'AI']; const [c, setC] = useState('All');
  const list = TECH.filter(t => c === 'All' || t[0] === c);
  const count = x => x === 'All' ? TECH.length : TECH.filter(t => t[0] === x).length;
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Head tag="Skills" title="My Tech Stack" sub="Technologies I use to build fast, scalable MERN applications" />

      <Reveal className="mb-10 flex flex-wrap justify-center gap-2">
        {cats.map(x => (
          <button key={x} onClick={() => setC(x)}
            className={`relative rounded-full border px-5 py-2 text-sm font-medium transition-colors ${c === x ? 'border-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'}`}>
            {c === x && <motion.span layoutId="tech-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-slate-900" />}
            <span className="relative flex items-center gap-2">
              {x}
              <span className={`rounded-full px-1.5 text-[10px] ${c === x ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count(x)}</span>
            </span>
          </button>
        ))}
      </Reveal>

      <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {list.map(([cat, n, d, i], k) => (
            <motion.div layout key={n}
              initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
              transition={{ delay: k * 0.025, duration: 0.45, ease: EASE }}
              whileHover={{ y: -8 }} whileTap={{ scale: 0.97 }} onMouseMove={spot}
              className="glass group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 hover:border-slate-900 hover:shadow-xl hover:shadow-slate-900/10">
              <Spotlight />
              {/* upar ki category tag */}
              <span className="absolute right-3 top-3 text-[9px] font-semibold uppercase tracking-widest text-slate-300 transition-colors group-hover:text-slate-500">{cat}</span>
              {/* neeche se aati hui black line */}
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-slate-900 transition-transform duration-500 group-hover:scale-x-100" />
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-100 transition-all duration-300 group-hover:rotate-6 group-hover:bg-white group-hover:ring-slate-200">
                <img src={i} alt={n} onError={e => (e.target.style.display = 'none')}
                  className="h-9 w-9 object-contain grayscale transition duration-300 group-hover:scale-110 group-hover:grayscale-0" />
              </div>
              <p className="relative mt-4 font-display font-semibold text-slate-900">{n}</p>
              <p className="relative mt-0.5 text-xs text-slate-500">{d}</p>
            </motion.div>))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

export function ProjectCard({ p, i = 0 }) {
  const img = p.imageUrl || p.thumbnail || p.image || p.coverImageUrl;
  const tech = p.technologies || p.techStack || [];
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (i % 3) * 0.12, duration: 0.7, ease: EASE }}
      whileHover={{ y: -10 }} onMouseMove={spot}
      className="glass group relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-900/15">

      <div className="relative h-56 overflow-hidden bg-slate-900">
        {img && !imageFailed
          ? <img src={img} alt={`${p.title} preview`} onError={() => setImageFailed(true)} className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-110 group-hover:opacity-100" />
          : <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)] font-display text-9xl font-bold text-white/10 transition-transform duration-700 group-hover:scale-110">{p.title?.[0]}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        {/* hover par shine sweep */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/15 opacity-0 blur-md transition-all duration-1000 group-hover:left-[130%] group-hover:opacity-100" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow backdrop-blur">{p.category || 'Web App'}</span>
        <span className="absolute bottom-3 right-5 font-display text-6xl font-bold leading-none text-white/20 transition-colors duration-500 group-hover:text-white/50">{String(i + 1).padStart(2, '0')}</span>
        {p.isFeatured && <span className="absolute left-4 bottom-4 rounded-full border border-white/30 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white/90 backdrop-blur">Featured</span>}
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-6">
        <Spotlight size={260} alpha={0.05} />
        <h3 className="relative text-xl font-bold tracking-tight text-slate-900">{p.title}</h3>
        <p className="relative line-clamp-2 text-sm leading-6 text-slate-500">{p.description}</p>
        <div className="relative flex flex-wrap gap-1.5">
          {tech.slice(0, 4).map(t => (
            <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors group-hover:border-slate-300">{t}</span>
          ))}
          {tech.length > 4 && <span className="rounded-full px-2 py-0.5 text-[11px] text-slate-400">+{tech.length - 4}</span>}
        </div>
        <Link to={`/projects/${p.slug || p._id}`} className="relative mt-auto flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">
          <span className="transition-transform duration-300 group-hover:translate-x-1">View Details</span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-900 transition-all duration-300 group-hover:rotate-45 group-hover:bg-slate-900 group-hover:text-white">
            <ArrowUpRight size={16} />
          </span>
        </Link>
      </div>

      {/* card ke neeche black progress line */}
      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-slate-900 transition-transform duration-700 group-hover:scale-x-100" />
    </motion.div>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ message: '', error: false });
  const [sending, setSending] = useState(false);
  const go = async e => {
    e.preventDefault();
    setStatus({ message: '', error: false });
    setSending(true);
    try {
      const result = await api('/contact', { method: 'POST', body: JSON.stringify(f) });
      setStatus({ message: result.message || 'Your message has been sent successfully.', error: false });
      setF({ name: '', email: '', message: '' });
      e.target.reset();
    } catch (error) {
      setStatus({ message: error.message || 'Unable to send your message. Please try again.', error: true });
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <Head tag="Contact" title="Let's Work Together" sub="Send a message and I'll get back to you" />
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Reveal>
          <motion.form onSubmit={go} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="glass space-y-4 rounded-3xl p-8 transition-shadow hover:shadow-xl hover:shadow-slate-900/10">
            <h3 className="text-xl font-bold">Send Message</h3>
            <input required className="inp" placeholder="Your Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
            <input required type="email" className="inp" placeholder="Your Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
            <textarea required rows={5} className="inp" placeholder="Your Message" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
            <AnimatePresence>
              {status.message && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className={`text-sm ${status.error ? 'text-red-600' : 'text-green-600'}`}>{status.message}</motion.p>}
            </AnimatePresence>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={sending} className="btn w-full disabled:cursor-not-allowed disabled:opacity-60">
              {sending ? 'Sending...' : 'Send Message'} <Send size={15} />
            </motion.button>
          </motion.form>
        </Reveal>
        <Reveal delay={0.15}><div className="mx-auto h-96 max-w-sm float"><Avatar /></div></Reveal>
      </div>
    </section>
  );
}