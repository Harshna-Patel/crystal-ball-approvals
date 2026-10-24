'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useChat, ChatMessage } from '../lib/store';
import { readEvents } from '../lib/stream';
import { Action } from '../shared/contracts';
import { queue } from '../data/queue';
const actions: [Action, string, string][] = [
  ['summary', 'Present me Summary', '▤'],
  ['talk', 'Talk to me', '◉'],
  ['help', 'Help me', '?'],
  ['teach', 'Teach me', '◇'],
];
export function ChatPanel() {
  const s = useChat();
  const [question, setQuestion] = useState('');
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [s.messages]);
  useEffect(() => () => abort.current?.abort(), []);
  async function send(action: Action, text = '') {
    if (useChat.getState().busy) return;
    let sessionId = useChat.getState().sessionId;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      s.set({ sessionId });
    }
    const history = s.messages
      .filter((m) => !m.fallback && !m.failed && m.content)
      .slice(-12)
      .map(({ role, content }) => ({ role, content: content.slice(0, 6000) }));
    const label = text || actions.find((a) => a[0] === action)?.[1] || 'Replay Greeting';
    const previous: ChatMessage[] = [
      ...s.messages,
      { role: 'user', content: label },
      { role: 'assistant', content: '' },
    ];
    s.set({ messages: previous, busy: true, error: '', action });
    setQuestion('');
    const controller = new AbortController();
    abort.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    const update = (patch: Partial<ChatMessage>) => {
      const now = useChat.getState().messages;
      useChat.setState({ messages: [...now.slice(0, -1), { ...now[now.length - 1], ...patch }] });
    };
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action, question: text, history, language: s.language }),
        signal: controller.signal,
      });
      await readEvents(response, (event) => {
        if (event.type === 'delta') {
          const now = useChat.getState().messages;
          update({ content: now[now.length - 1].content + event.text });
        }
        if (event.type === 'fallback') {
          update({ content: '', fallback: true });
          s.set({
            error: event.diagnostic?.message || 'AI is temporarily unavailable. Please retry.',
          });
        }
        if (event.type === 'done')
          update({ content: event.answer.text, answer: event.answer, fallback: event.fallback });
      });
    } catch (error) {
      update({ content: 'Response incomplete. Please try again.', failed: true });
      s.set({
        error:
          error instanceof Error && error.message.includes('Too many')
            ? error.message
            : 'Connection failed. Please retry.',
      });
    } finally {
      clearTimeout(timer);
      s.set({ busy: false });
    }
  }
  if (!s.open)
    return (
      <button className="reopen" onClick={() => s.set({ open: true })}>
        Open approvals assistant
      </button>
    );
  const current = s.messages.at(-1);
  return (
    <aside className="assistant" aria-label="Approvals assistant">
      <header className="assistant-header">
        <span className="avatar">✦</span>
        <strong>Approvals</strong>
        <button
          aria-label="Close assistant"
          onClick={() => {
            abort.current?.abort();
            s.set({ open: false });
          }}
        >
          ×
        </button>
      </header>
      <div className="assistant-nav">
        <span>⌂ Approvals</span>
        <button disabled={s.busy} onClick={() => send('greeting')}>
          Replay Greeting
        </button>
      </div>
      <div className="actions">
        {actions.map(([action, label, icon]) => (
          <button key={action} disabled={s.busy} onClick={() => send(action)}>
            <span className={'action-icon ' + action}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="conversation" aria-live="polite">
        {s.messages.length === 0 && (
          <p className="empty">Choose an action to explore the four pending approvals.</p>
        )}
        {s.messages.map((m, i) => (
          <article key={i} className={'message ' + m.role}>
            <small>
              {m.role === 'user' ? 'You' : m.fallback ? 'Assistant · local fallback' : 'Assistant'}
            </small>
            <p>{m.content}</p>
            {m.answer?.priorities.map((p) => (
              <div key={p.id} className="priority">
                <strong>{queue.find((q) => q.id === p.id)?.title}</strong>
                <p>{p.reason}</p>
              </div>
            ))}
            {!!m.answer?.sources.length && (
              <small>Policy sources: {m.answer.sources.join(', ')}</small>
            )}
          </article>
        ))}
        {s.busy && <p role="status">{current?.content ? 'Receiving response…' : 'Thinking…'}</p>}
        <div ref={bottom} />
      </div>
      {s.error && (
        <p role="alert" className="error">
          {s.error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim())
            send(
              s.action === 'greeting' || s.action === 'summary' ? 'talk' : s.action,
              question.trim(),
            );
        }}
      >
        <label className="sr-only" htmlFor="question">
          Ask a follow-up
        </label>
        <input
          id="question"
          maxLength={1500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a follow-up…"
          disabled={s.busy}
        />
        <button disabled={s.busy || !question.trim()}>Send</button>
      </form>
      <footer>
        <label>
          Language{' '}
          <select
            aria-label="Language"
            disabled={s.busy}
            value={s.language}
            onChange={(e) => s.set({ language: e.target.value as typeof s.language })}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Gujarati</option>
          </select>
        </label>
        <span>4 pending items</span>
      </footer>
    </aside>
  );
}
