import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import { useChat } from '../lib/store';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useChat.setState({ messages: [], busy: false, error: '', open: true });
});
test('shows loading then incremental response before completion', async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              controller = c;
            },
          }),
        ),
    ),
  );
  render(<ChatPanel />);
  fireEvent.click(screen.getByText('Present me Summary'));
  expect(screen.getByRole('status')).toHaveTextContent('Thinking');
  const send = (s: unknown) =>
    controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(s) + '\n\n'));
  send({ type: 'delta', text: 'First token' });
  await waitFor(() => expect(screen.getByText('First token')).toBeInTheDocument());
  expect(screen.getByRole('status')).toHaveTextContent('Receiving');
  send({
    type: 'done',
    answer: { text: 'First token complete', priorities: [], sources: [] },
    fallback: false,
  });
  controller.close();
  await waitFor(() => expect(screen.getByText('First token complete')).toBeInTheDocument());
});
test('network failure is visible and controls recover', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  render(<ChatPanel />);
  fireEvent.click(screen.getByText('Help me'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connection failed'));
  expect(screen.getByRole('button', { name: /Help me/ })).not.toBeDisabled();
});
test('truncated stream is an error rather than silent success', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('data: {"type":"delta","text":"partial"}\n\n')),
  );
  render(<ChatPanel />);
  fireEvent.click(screen.getByText('Talk to me'));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
});

test('fallback shows actionable provider diagnostic and replaces provisional text', async () => {
  const frames = [
    { type: 'delta', text: 'Provisional' },
    {
      type: 'fallback',
      reason: 'unavailable',
      diagnostic: { code: 'invalid_key', message: 'Replace the API key and restart the server.' },
    },
    {
      type: 'done',
      answer: { text: 'Local fallback guidance', priorities: [], sources: [] },
      fallback: true,
    },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () => new Response(frames.map((e) => 'data: ' + JSON.stringify(e) + '\n\n').join('')),
    ),
  );
  render(<ChatPanel />);
  fireEvent.click(screen.getByRole('button', { name: /Talk to me/ }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Replace the API key'));
  expect(screen.queryByText('Provisional')).not.toBeInTheDocument();
  expect(screen.getByText('Local fallback guidance')).toBeInTheDocument();
});
