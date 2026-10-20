const API_ORIGIN = import.meta.env.VITE_API_URL || 'https://portfolio-3wxj.onrender.com';
const B = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;
export const arr = d => (Array.isArray(d) ? d : d?.data || d?.projects || d?.blogs || []);

export async function streamChat(question, conversationId, onEvent, { signal } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const abortRequest = () => controller.abort();
  if (signal?.aborted) abortRequest();
  else signal?.addEventListener('abort', abortRequest, { once: true });
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 120000);
  let reader;
  try {
    const response = await fetch(`${B}/rag/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ question, ...(conversationId ? { conversationId } : {}) }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || `Chat request failed (${response.status}).`);
    }
    if (!response.headers.get('content-type')?.includes('text/event-stream')) {
      throw new Error('The server returned an unexpected chat response.');
    }
    if (!response.body) throw new Error('This browser does not support streamed chat responses.');

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;
    let receivedAnswer = false;
    const processFrame = (frame) => {
      const data = frame.split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5))
        .join('\n')
        .trim();
      if (!data) return;
      let event;
      try {
        event = JSON.parse(data);
      } catch {
        throw new Error('The server sent an unreadable chat response.');
      }
      if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
        throw new Error('The server sent an invalid chat response.');
      }
      if (event.type === 'error') throw new Error(event.message || 'Unable to complete the answer.');
      if (event.type === 'start' && typeof event.conversationId !== 'string') {
        throw new Error('The server did not create a valid chat conversation.');
      }
      if (event.type === 'token' && typeof event.token !== 'string') {
        throw new Error('The server sent an invalid answer segment.');
      }
      if (event.type === 'token' && event.token.trim()) receivedAnswer = true;
      if (event.type === 'complete') {
        if (!receivedAnswer) throw new Error('The assistant returned an empty answer. Please retry your question.');
        completed = true;
      }
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
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(timedOut
        ? 'The response took too long. Please retry your question.'
        : 'The chat request was cancelled.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
    if (reader) await reader.cancel().catch(() => {});
  }
}

export async function api(path, opt = {}) {
  const isForm = opt.body instanceof FormData;
  const r = await fetch(B + path, { credentials: 'include', ...opt, headers: isForm ? {} : { 'Content-Type': 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'Request failed');
  return j;
}
