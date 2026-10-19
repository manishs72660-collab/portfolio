const API_ORIGIN = import.meta.env.VITE_API_URL || 'https://portfolio-3wxj.onrender.com';
const B = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;
export const arr = d => (Array.isArray(d) ? d : d?.data || d?.projects || d?.blogs || []);
export async function api(path, opt = {}) {
  const isForm = opt.body instanceof FormData;
  const r = await fetch(B + path, { credentials: 'include', ...opt, headers: isForm ? {} : { 'Content-Type': 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'Request failed');
  return j;
}
