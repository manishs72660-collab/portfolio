import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Cat, LoaderCircle, MessageCircle, Send, Sparkles, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, streamChat } from './api.js';

const STORAGE_KEY = 'portfolio-chat-conversation';
const SUGGESTIONS = [
  'What projects has Manish built?',
  'Which technologies does he use?',
  'Tell me about his education.',
];

function plainText(value) {
  return Children.toArray(value).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    return isValidElement(child) ? plainText(child.props.children) : '';
  }).join('');
}

function ResponsiveTable({ children }) {
  const sections = Children.toArray(children);
  const head = sections.find((section) => isValidElement(section) && section.type === 'thead');
  const body = sections.find((section) => isValidElement(section) && section.type === 'tbody');
  const headerRow = head && Children.toArray(head.props.children)
    .find((row) => isValidElement(row) && row.type === 'tr');
  const headers = headerRow
    ? Children.toArray(headerRow.props.children).map((cell) => plainText(cell.props?.children))
    : [];
  const rows = body
    ? Children.toArray(body.props.children).filter((row) => isValidElement(row) && row.type === 'tr')
    : [];

  if (!headers.length || !rows.length) {
    return (
      <div className="my-3 max-w-full overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[480px] table-fixed border-collapse text-left text-xs">{children}</table>
      </div>
    );
  }

  return (
    <div className="my-3 grid min-w-0 max-w-full gap-3">
      {rows.map((row, rowIndex) => {
        const cells = Children.toArray(row.props.children);
        const title = plainText(cells[0]?.props?.children).trim() || `Item ${rowIndex + 1}`;
        return (
          <article key={`${title}-${rowIndex}`} className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <h4 className="mb-2 break-words text-sm font-semibold leading-5 text-slate-900 [overflow-wrap:anywhere]">
              {cells[0]?.props?.children || title}
            </h4>
            <dl className="grid min-w-0 gap-2">
              {headers.slice(1).map((header, cellIndex) => (
                <div key={`${header}-${cellIndex}`} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{header}</dt>
                  <dd className="mt-0.5 min-w-0 break-words text-xs leading-5 text-slate-700 [overflow-wrap:anywhere]">
                    {cells[cellIndex + 1]?.props?.children || '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function stableMarkdown(content, streaming) {
  if (!streaming) return content;

  let visible = content;
  const fences = [...visible.matchAll(/```/g)];
  if (fences.length % 2 === 1) visible = visible.slice(0, fences[fences.length - 1].index);

  const lines = visible.split('\n');
  let lineStart = 0;
  let insideCodeBlock = false;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) {
      insideCodeBlock = !insideCodeBlock;
      lineStart += lines[index].length + 1;
      continue;
    }
    if (insideCodeBlock || !/^\s*\|/.test(lines[index])) {
      lineStart += lines[index].length + 1;
      continue;
    }
    const separator = lines[index + 1];
    const firstRow = lines[index + 2];
    if (!separator || !/^\s*\|?\s*:?-{3,}/.test(separator) || !firstRow?.includes('|')) {
      return visible.slice(0, lineStart);
    }
    let lastRow = index + 2;
    while (lastRow + 1 < lines.length && /^\s*\|/.test(lines[lastRow + 1])) lastRow += 1;
    if (lastRow === lines.length - 1 && !visible.endsWith('\n')) {
      return visible.slice(0, lineStart);
    }
    lineStart += lines.slice(index, lastRow + 1).reduce((length, line) => length + line.length + 1, 0);
    index = lastRow;
  }
  return visible;
}

function ChatMessageContent({ content, streaming }) {
  const visibleContent = stableMarkdown(content, streaming);
  return (
    <div className="portfolio-chat-markdown min-w-0 max-w-full break-words text-sm leading-6 [overflow-wrap:anywhere]">
      {visibleContent ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h3 className="mb-2 mt-3 max-w-full break-words text-base font-bold text-slate-900 first:mt-0 [overflow-wrap:anywhere]">{children}</h3>,
            h2: ({ children }) => <h3 className="mb-2 mt-3 max-w-full break-words text-[15px] font-bold text-slate-900 first:mt-0 [overflow-wrap:anywhere]">{children}</h3>,
            h3: ({ children }) => <h3 className="mb-1.5 mt-3 max-w-full break-words text-sm font-bold text-slate-900 first:mt-0 [overflow-wrap:anywhere]">{children}</h3>,
            p: ({ children }) => <p className="mb-2 max-w-full break-words last:mb-0 [overflow-wrap:anywhere]">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 max-w-full list-disc space-y-1 pl-5 last:mb-0 [overflow-wrap:anywhere]">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 max-w-full list-decimal space-y-1 pl-5 last:mb-0 [overflow-wrap:anywhere]">{children}</ol>,
            li: ({ children }) => <li className="max-w-full break-words pl-0.5 [overflow-wrap:anywhere]">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
            blockquote: ({ children }) => <blockquote className="my-2 max-w-full break-words border-l-2 border-violet-300 pl-3 text-slate-600 [overflow-wrap:anywhere]">{children}</blockquote>,
            pre: ({ children }) => (
              <div className="my-2 max-w-full overflow-x-auto rounded-lg bg-slate-950 p-3 text-slate-100">
                <pre className="max-w-full whitespace-pre font-mono text-xs leading-5">{children}</pre>
              </div>
            ),
            code: ({ children, className }) => (
              <code className={`${className || ''} break-words rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-violet-700 [overflow-wrap:anywhere]`}>
                {children}
              </code>
            ),
            table: ({ children }) => <ResponsiveTable>{children}</ResponsiveTable>,
            a: ({ href = '', children }) => {
              let parsed;
              try {
                parsed = new URL(href, window.location.origin);
              } catch {
                return <span>{children}</span>;
              }
              if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return <span>{children}</span>;
              const external = parsed.origin !== window.location.origin;
              return external ? (
                <a
                  href={parsed.href}
                  target="_blank"
                  rel="noreferrer"
                  className="portfolio-chat-url group my-1.5 flex min-w-0 max-w-full items-center gap-3 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-white to-sky-50 px-3 py-2.5 text-left no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-sm">
                    <ArrowUpRight size={17} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{children}</span>
                  <ArrowUpRight size={15} className="shrink-0 text-violet-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : (
                <a href={parsed.href} className="break-all font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900">
                  {children}
                </a>
              );
            },
          }}
        >
          {visibleContent}
        </ReactMarkdown>
      ) : streaming ? (
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Sparkles size={14} className="text-violet-500" /> Thinking from the portfolio...
        </span>
      ) : null}
      {streaming && content && <span className="portfolio-chat-caret" aria-hidden="true" />}
    </div>
  );
}

function storedConversationId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveConversationId(conversationId) {
  try {
    if (conversationId) window.localStorage.setItem(STORAGE_KEY, conversationId);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The chat continues for this visit if browser storage is unavailable.
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(storedConversationId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(Boolean(conversationId));
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [failedQuestion, setFailedQuestion] = useState('');
  const [failedUserMessageId, setFailedUserMessageId] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const conversationIdRef = useRef(conversationId);
  const skipHistoryLoadRef = useRef('');
  const sendingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const messageSequenceRef = useRef(0);
  const streamControllerRef = useRef(null);

  useEffect(() => () => streamControllerRef.current?.abort(), []);

  function createMessage(role, content, extra = {}) {
    messageSequenceRef.current += 1;
    return {
      id: `chat-${Date.now()}-${messageSequenceRef.current}`,
      role,
      content,
      ...extra,
    };
  }

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoadingHistory(false);
      return undefined;
    }

    if (skipHistoryLoadRef.current === conversationId) {
      skipHistoryLoadRef.current = '';
      setLoadingHistory(false);
      return undefined;
    }

    let active = true;
    setLoadingHistory(true);
    api(`/rag/conversations/${encodeURIComponent(conversationId)}`)
      .then(({ data }) => {
        if (active) {
          if (!data || !Array.isArray(data.messages)) {
            throw new Error('The saved conversation could not be read. Please retry.');
          }
          setMessages((data.messages || []).map((message) => createMessage(
            message.role,
            message.content,
            { sources: message.sources || [] },
          )));
        }
      })
      .catch((loadError) => {
        if (!active) return;
        if (/not found|expired/i.test(loadError.message)) {
          saveConversationId('');
          conversationIdRef.current = '';
          skipHistoryLoadRef.current = '';
          setConversationId('');
          setMessages([]);
        } else {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => { active = false; };
  }, [conversationId]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (shouldAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, loadingHistory, open, error]);

  async function sendMessage(event, questionToRetry = '', existingUserMessageId = '') {
    event?.preventDefault();
    const question = (questionToRetry || draft).trim();
    if (!question || sendingRef.current || loadingHistory || clearing) return;

    sendingRef.current = true;
    setSending(true);
    setError('');
    setFailedQuestion('');
    const userMessage = existingUserMessageId
      ? null
      : createMessage('user', question);
    const assistantMessage = createMessage('assistant', '', { sources: [] });
    if (userMessage) setFailedUserMessageId(userMessage.id);
    shouldAutoScrollRef.current = true;
    setMessages(current => [
      ...current,
      ...(userMessage ? [userMessage] : []),
      assistantMessage,
    ]);
    if (!questionToRetry) setDraft('');
    const streamController = new AbortController();
    streamControllerRef.current = streamController;
    try {
      await streamChat(question, conversationIdRef.current, (event) => {
        if (event.type === 'start') {
          const isNewConversation = conversationIdRef.current !== event.conversationId;
          conversationIdRef.current = event.conversationId;
          if (isNewConversation) skipHistoryLoadRef.current = event.conversationId;
          setConversationId(event.conversationId);
          saveConversationId(event.conversationId);
        } else if (event.type === 'token') {
          setMessages(current => current.map((message) => (
            message.id === assistantMessage.id
              ? { ...message, content: message.content + event.token }
              : message
          )));
        } else if (event.type === 'complete') {
          setMessages(current => current.map((message) => (
            message.id === assistantMessage.id
              ? { ...message, sources: event.sources || [] }
              : message
          )));
        }
      }, { signal: streamController.signal });
      setFailedQuestion('');
      setFailedUserMessageId('');
    } catch (sendError) {
      setError(sendError.message || 'Unable to send your message. Please try again.');
      setFailedQuestion(question);
      setMessages(current => current.filter((message) => (
        message.id !== assistantMessage.id
      )));
    } finally {
      if (streamControllerRef.current === streamController) streamControllerRef.current = null;
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function clearConversation() {
    if (clearing || sending) return;
    setClearing(true);
    setError('');
    try {
      if (conversationId) {
        await api(`/rag/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
      }
      saveConversationId('');
      conversationIdRef.current = '';
      setConversationId('');
      setMessages([]);
      setDraft('');
      setFailedQuestion('');
      setFailedUserMessageId('');
      shouldAutoScrollRef.current = true;
    } catch (clearError) {
      setError(clearError.message || 'Unable to clear this conversation.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="portfolio-chat fixed bottom-5 right-5 z-[70] sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {open && (
          <motion.section
            key="portfolio-chat-panel"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            aria-label="Chat with the portfolio assistant"
            className="portfolio-chat-panel mb-3 flex h-[min(620px,calc(100dvh-112px))] w-[min(390px,calc(100vw-24px))] min-w-0 max-w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_-18px_rgba(15,23,42,0.36)]"
          >
            <header className="flex shrink-0 items-center gap-3 bg-slate-950 px-4 py-4 text-white">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-lime-300 ring-1 ring-white/15">
                <Cat size={24} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-white">Portfolio Cat</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Answers grounded in portfolio data
                </p>
              </div>
              <button
                type="button"
                onClick={clearConversation}
                disabled={clearing || sending || (!conversationId && messages.length === 0)}
                aria-label="Clear conversation memory"
                title="Clear conversation"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {clearing ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X size={19} />
              </button>
            </header>

            <div
              ref={scrollRef}
              onScroll={(event) => {
                const element = event.currentTarget;
                shouldAutoScrollRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 96;
              }}
              className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-5"
            >
              {loadingHistory ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <LoaderCircle size={17} className="animate-spin" /> Restoring your chat...
                </div>
              ) : messages.length === 0 ? (
                <div>
                  <div className="mb-5 max-w-[88%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm leading-6 text-slate-700">
                      Hi! I can help you explore Manish&apos;s projects, skills, and portfolio. I&apos;ll only answer when the portfolio has relevant information.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {SUGGESTIONS.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setDraft(suggestion)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="min-w-0 max-w-full space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                    key={message.id || `${index}-${message.role}`}
                      initial={{ opacity: 0, y: 10, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className={`flex min-w-0 max-w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'portfolio-chat-user rounded-br-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-slate-900/10'
                          : 'portfolio-chat-assistant rounded-bl-sm border border-slate-200/90 bg-white text-slate-700 shadow-slate-900/5'
                      }`}>
                        <ChatMessageContent
                          content={message.content}
                          streaming={sending && message.role === 'assistant' && index === messages.length - 1}
                        />
                        {message.role === 'assistant' && message.sources?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                            {message.sources.map(source => (
                              <a
                                key={`${source.type}-${source.url}-${source.title}`}
                                href={source.url}
                                className="portfolio-chat-source inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                              >
                                <span className="truncate">{source.title}</span>
                                <ArrowUpRight size={11} className="shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {error && (
                <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                  <span className="min-w-0 flex-1 break-words">{error}</span>
                  {failedQuestion && (
                    <button
                      type="button"
                      onClick={() => sendMessage(undefined, failedQuestion, failedUserMessageId)}
                      disabled={sending || loadingHistory || clearing}
                      className="shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="shrink-0 border-t border-slate-200 bg-white p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  maxLength={1000}
                  rows={1}
                  aria-label="Your message"
                  placeholder="Ask about the portfolio..."
                  className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending || loadingHistory || clearing}
                  aria-label="Send message"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">Chat memory is saved for up to 30 days</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label={open ? 'Close portfolio chat' : 'Open portfolio chat'}
        aria-expanded={open}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="portfolio-chat-launcher relative ml-auto grid h-16 w-16 place-items-center rounded-full border border-white/70 bg-gradient-to-br from-slate-950 via-slate-800 to-violet-900 text-lime-300 shadow-[0_12px_36px_-8px_rgba(15,23,42,0.65)] ring-1 ring-slate-900/10 transition-colors hover:text-white"
      >
        <span className="portfolio-chat-orbit" aria-hidden="true" />
        {open ? <MessageCircle size={27} strokeWidth={1.9} /> : <Cat size={30} strokeWidth={1.8} />}
        {!open && <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-lime-300 text-[10px] font-bold text-slate-950">AI</span>}
      </motion.button>
    </div>
  );
}
