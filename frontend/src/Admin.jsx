import { useEffect, useRef, useState } from 'react';
import { api, arr } from './api.js';
import { LoaderCircle, Pencil, X } from 'lucide-react';

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
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSelectedFile, setHasSelectedFile] = useState(false);
  const submittingRef = useRef(false);
  const load = async () => {
    try {
      const data = await api(`/${kind}/admin`);
      setItems(arr(data));
    } catch (error) {
      setMsg(error.message);
    }
  };
  useEffect(() => { load(); }, [kind]);
  const save = async e => {
    e.preventDefault(); setMsg('');
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const body = new FormData(form);
      body.set('isPublished', form.elements.isPublished.checked ? 'true' : 'false');
      const slug = body.get('slug');
      if (!slug?.trim()) body.delete('slug');
      if (isP) body.set('isFeatured', form.elements.isFeatured.checked ? 'true' : 'false');

      await api(editing ? `/${kind}/${editing._id}` : `/${kind}`, {
        method: editing ? 'PATCH' : 'POST',
        body,
      });
      setMsg(editing ? `${isP ? 'Project' : 'Blog'} updated successfully.` : `${isP ? 'Project' : 'Blog'} created successfully.`);
      setEditing(null);
      setHasSelectedFile(false);
      await load();
    } catch (error) {
      setMsg(error.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };
  const togglePublished = async item => {
    setMsg('');
    try {
      await api(`/${kind}/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      load();
    } catch (x) {
      setMsg(x.message);
    }
  };
  const del = async id => { if (confirm('Delete?')) { await api(`/${kind}/${id}`, { method: 'DELETE' }); load(); } };
  const startEditing = item => {
    setMsg('');
    setHasSelectedFile(false);
    setEditing(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const currentImage = editing && (isP ? editing.imageUrl : editing.coverImageUrl);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form key={editing?._id || 'create'} onSubmit={save} className="glass space-y-3 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{editing ? 'Edit' : 'Add'} {isP ? 'Project' : 'Blog'}</h3>
          {editing && <button type="button" onClick={() => { setEditing(null); setMsg(''); setHasSelectedFile(false); }} className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"><X size={15} /> Cancel</button>}
        </div>
        <fieldset disabled={submitting} className="space-y-3 disabled:opacity-70">
          <input name="title" required className={box} placeholder="Title" defaultValue={editing?.title || ''} />
          <input name="slug" className={box} placeholder="Slug (optional; generated from title)" defaultValue={editing?.slug || ''} />
          {isP ? <>
            <textarea name="description" required rows={5} className={box} placeholder="Description" defaultValue={editing?.description || ''} />
            <input name="category" required className={box} placeholder="Category (e.g. Full Stack)" defaultValue={editing?.category || ''} />
            <input name="technologies" className={box} placeholder="Technologies (comma separated)" defaultValue={(editing?.technologies || []).join(', ')} />
            <input name="liveUrl" type="url" className={box} placeholder="Live demo URL" defaultValue={editing?.liveUrl || ''} />
            <input name="githubUrl" type="url" className={box} placeholder="GitHub URL" defaultValue={editing?.repositoryUrl || ''} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="isFeatured" defaultChecked={Boolean(editing?.isFeatured)} />
              Featured project
            </label>
          </> : <>
            <input name="excerpt" className={box} placeholder="Short excerpt" defaultValue={editing?.excerpt || ''} />
            <textarea name="content" required rows={8} className={box} placeholder="Blog content" defaultValue={editing?.content || ''} />
            <input name="tags" className={box} placeholder="Tags (comma separated)" defaultValue={(editing?.tags || []).join(', ')} />
            <input name="categories" className={box} placeholder="Categories (comma separated)" defaultValue={(editing?.categories || []).join(', ')} />
            <input name="seoTitle" className={box} placeholder="SEO title" defaultValue={editing?.seoTitle || ''} />
            <textarea name="metaDescription" rows={2} className={box} placeholder="Meta description" defaultValue={editing?.metaDescription || ''} />
          </>}
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isPublished" defaultChecked={editing ? Boolean(editing.isPublished) : true} />
            Published
          </label>
          {currentImage && <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Current image{hasSelectedFile ? ' (will be replaced after save)' : ''}</p>
            <img src={currentImage} alt={`Current ${isP ? 'project thumbnail' : 'blog cover'}`} className="max-h-48 w-full rounded-lg border border-slate-200 object-contain" />
          </div>}
          <label className="block text-sm font-medium text-slate-700">
            {editing ? 'Replace image (optional)' : 'Image (optional)'}
            <input type="file" name={file} accept="image/png,image/jpeg,image/gif,image/webp" className="mt-2 block w-full text-sm text-slate-600" onChange={e => setHasSelectedFile(Boolean(e.target.files?.length))} />
          </label>
          {msg && <p role="status" className={`text-xs ${msg.includes('successfully') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}
          <button disabled={submitting} className={`${primary} flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}>
            {submitting && <LoaderCircle size={16} className="animate-spin" />}
            {submitting ? (hasSelectedFile ? 'Uploading media...' : 'Saving...') : editing ? 'Save changes' : 'Create'}
          </button>
        </fieldset>
      </form>
      <div className="space-y-3">
        {items.map(i => {
          const image = isP ? i.imageUrl : i.coverImageUrl;
          return <div key={i._id} className="glass flex items-center gap-3 rounded-xl p-3 text-sm">
            {image
              ? <img src={image} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover" />
              : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-lg font-bold text-slate-400">{i.title?.[0]}</div>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-800">{i.title}</p>
              <span className="text-xs text-slate-500">{i.isPublished ? 'Published' : 'Draft'}</span>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-3">
              <button onClick={() => startEditing(i)} className="inline-flex items-center gap-1 text-xs text-slate-700 underline"><Pencil size={12} /> Edit</button>
              <button onClick={() => togglePublished(i)} className="text-xs text-slate-700 underline">{i.isPublished ? 'Move to draft' : 'Publish'}</button>
              <button onClick={() => del(i._id)} className="text-xs text-red-600">Delete</button>
            </div>
          </div>
        })}
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