const API_ORIGIN = import.meta.env.VITE_API_URL || 'https://portfolio-3wxj.onrender.com';
const B = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;
export const arr = d => (Array.isArray(d) ? d : d?.data || d?.projects || d?.blogs || []);

export async function streamChat(question, conversationId, onEvent) {
  const response = await fetch(`${B}/rag/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ question, ...(conversationId ? { conversationId } : {}) }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || 'Unable to send your message.');
  }
  if (!response.body) throw new Error('This browser does not support streamed chat responses.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  const processFrame = (frame) => {
    const data = frame.split(/\r?\n/)
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())
      .join('\n');
    if (!data) return;
    const event = JSON.parse(data);
    if (event.type === 'error') throw new Error(event.message || 'Unable to complete the answer.');
    if (event.type === 'complete') completed = true;
    onEvent(event);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() || '';
    frames.forEach(processFrame);
    if (done) break;
  }
  if (buffer.trim()) processFrame(buffer);
  if (!completed) throw new Error('The chat stream ended before the answer was complete.');
}

export async function api(path, opt = {}) {
  const isForm = opt.body instanceof FormData;
  const r = await fetch(B + path, { credentials: 'include', ...opt, headers: isForm ? {} : { 'Content-Type': 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'Request failed');
  return j;
}
