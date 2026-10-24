import { openAIProvider } from './provider';

afterEach(() => {
  jest.restoreAllMocks();
});

test('real SDK parses structured SSE and emits growing text before the final object', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldForce = process.env.AI_FORCE_TIMEOUT;
  process.env.OPENAI_API_KEY = 'test-key-not-a-real-secret';
  process.env.AI_FORCE_TIMEOUT = 'false';
  const chunks = [
    {
      id: 'mock',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'gpt-4o',
      choices: [
        { index: 0, delta: { role: 'assistant', content: '{"text":"Hello' }, finish_reason: null },
      ],
    },
    {
      id: 'mock',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'gpt-4o',
      choices: [
        {
          index: 0,
          delta: { content: ' operator","priorities":[],"sources":[]}' },
          finish_reason: null,
        },
      ],
    },
    {
      id: 'mock',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'gpt-4o',
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    },
  ];
  const body =
    chunks.map((chunk) => 'data: ' + JSON.stringify(chunk) + '\n\n').join('') + 'data: [DONE]\n\n';
  const transport = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }));
  const received: string[] = [];
  try {
    const answer = await openAIProvider(
      [{ role: 'user', content: 'Hello' }],
      (text) => received.push(text),
      new AbortController().signal,
    );
    expect(answer).toEqual({ text: 'Hello operator', priorities: [], sources: [] });
    expect(received.join('')).toBe('Hello operator');
    expect(received.length).toBeGreaterThan(1);
    expect(transport).toHaveBeenCalledTimes(1);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldForce === undefined) delete process.env.AI_FORCE_TIMEOUT;
    else process.env.AI_FORCE_TIMEOUT = oldForce;
  }
});
