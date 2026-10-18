import { useEffect, useRef, useState } from 'react';
import { api, arr } from './api.js';
import { LoaderCircle } from 'lucide-react';

const box = 'inp';
const primary = 'w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700';

function Login({ onDone }) {
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState('');
  const go = async e => {
    e.preventDefault(); setErr('');
    try { await api('/auth/login', { method: 'POST', body: JSON.stringify(f) }); onDone(); } catch (x) { setErr(x.message); }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#c9ccd9_0%,#f4f5f9_100%)] px-4">
      <form onSubmit={go} className="glass w-full max-w-sm space-y-3 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Admin Login</h1>
        <input required type="email" className={box} placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input required type="password" className={box} placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <button className={primary}>Login</button>
      </form>
    </main>
  );
}

function Manager({ kind }) {
  const isP = kind === 'projects', file = isP ? 'thumbnail' : 'coverImage';
  const [items, setItems] = useState([]); const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSelectedFile, setHasSelectedFile] = useState(false);
  const submittingRef = useRef(false);
  const load = () => api(`/${kind}/admin`).then(d => setItems(arr(d))).catch(e => setMsg(e.message));
  useEffect(() => { load(); }, [kind]);
  const add = async e => {
    e.preventDefault(); setMsg('');
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await api(`/${kind}`, { method: 'POST', body: new FormData(e.target) });
      e.target.reset();
      setHasSelectedFile(false);
      load();
    } catch (x) {
      setMsg(x.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };
  const togglePublished = async item => {
    setMsg('');
    try {
      await api(`/blogs/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      load();
    } catch (x) {
      setMsg(x.message);
    }
  };
  const del = async id => { if (confirm('Delete?')) { await api(`/${kind}/${id}`, { method: 'DELETE' }); load(); } };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={add} className="glass space-y-3 rounded-2xl p-5">
        <h3 className="font-bold text-slate-900">Add {isP ? 'Project' : 'Blog'}</h3>
        <fieldset disabled={submitting} className="space-y-3 disabled:opacity-70">
          <input name="title" required className={box} placeholder="Title" />
          <textarea name={isP ? 'description' : 'content'} required rows={5} className={box} placeholder={isP ? 'Description' : 'Content'} />
          {!isP && <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isPublished" value="true" defaultChecked />
            Publish immediately
          </label>}
          {isP && <>
            <input name="techStack" className={box} placeholder="Tech stack (comma separated)" />
            <input name="liveUrl" className={box} placeholder="Live URL" />
            <input name="githubUrl" className={box} placeholder="GitHub URL" />
          </>}
          <input type="file" name={file} accept="image/*" className="text-sm text-slate-600" onChange={e => setHasSelectedFile(Boolean(e.target.files?.length))} />
          {msg && <p className="text-xs text-red-600">{msg}</p>}
          <button disabled={submitting} className={`${primary} flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}>
            {submitting && <LoaderCircle size={16} className="animate-spin" />}
            {submitting ? (hasSelectedFile ? 'Uploading media...' : 'Saving...') : 'Create'}
          </button>
        </fieldset>
      </form>
      <div className="space-y-2">
        {items.map(i => <div key={i._id} className="glass flex items-center justify-between gap-3 rounded-lg p-3 text-sm">
          <span className="text-slate-800">{i.title}{!isP && <span className="ml-2 text-xs text-slate-500">{i.isPublished ? 'Published' : 'Draft'}</span>}</span>
          <div className="flex gap-3">
            {!isP && <button onClick={() => togglePublished(i)} className="text-xs text-slate-700 underline">{i.isPublished ? 'Unpublish' : 'Publish'}</button>}
            <button onClick={() => del(i._id)} className="text-xs text-red-600">Delete</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}

export default function Admin() {
  const [auth, setAuth] = useState(null); const [tab, setTab] = useState('projects');
  const check = () => api('/auth/me').then(() => setAuth(true)).catch(() => setAuth(false));
  useEffect(() => { check(); }, []);
  if (auth === null) return <p className="p-24 text-slate-500">Loading...</p>;
  if (!auth) return <Login onDone={check} />;
  return (
    <main className="mx-auto max-w-6xl px-6 pb-12 pt-28">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <button className="text-sm text-slate-700 underline" onClick={async () => { await api('/auth/logout', { method: 'POST' }); setAuth(false); }}>Logout</button>
      </div>
      <div className="mb-6 flex gap-2">{['projects', 'blogs'].map(t =>
        <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm ${tab === t ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>{t}</button>)}</div>
      <Manager key={tab} kind={tab} />
    </main>
  );
}