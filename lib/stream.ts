import { eventSchema, StreamEvent } from '../shared/contracts';
export async function readEvents(response: Response, onEvent: (e: StreamEvent) => void) {
  if (!response.ok)
    throw Error(
      response.status === 429
        ? 'Too many requests. Wait one minute.'
        : 'Connection failed. Please retry.',
    );
  if (!response.body) throw Error('Streaming unavailable.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  function consume() {
    let end: number;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      for (const line of frame.split('\n'))
        if (line.startsWith('data: ')) {
          const event = eventSchema.parse(JSON.parse(line.slice(6)));
          onEvent(event);
          if (event.type === 'done') completed = true;
        }
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        consume();
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      consume();
      if (buffer.length > 100000) throw Error('Response too large.');
    }
    if (!completed) throw Error('Connection failed. Response interrupted; please retry.');
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
