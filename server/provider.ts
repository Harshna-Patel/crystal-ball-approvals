import { ConfigurationError } from './diagnostics';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { providerAnswerSchema } from '../shared/contracts';
export type Message = { role: 'system' | 'user' | 'assistant'; content: string };
export type Provider = (
  messages: Message[],
  emit: (text: string) => void,
  signal: AbortSignal,
) => Promise<unknown>;
export const openAIProvider: Provider = async (messages, emit, signal) => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || /YOUR_|ACTUAL_API_KEY|paste/i.test(key)) throw new ConfigurationError('missing_key');
  if (process.env.AI_FORCE_TIMEOUT === 'true')
    return new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }),
    );
  const client = new OpenAI({ apiKey: key, maxRetries: 0, fetch: globalThis.fetch });
  const stream = client.beta.chat.completions.stream(
    {
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      response_format: zodResponseFormat(providerAnswerSchema, 'approval_answer'),
      max_tokens: 650,
    },
    { signal },
  );
  let sent = '';
  // The SDK incrementally parses JSON. Render only the growing text field, never raw JSON fragments.
  stream.on('content.delta', (event) => {
    const partial = event.parsed as { text?: unknown } | null;
    if (typeof partial?.text === 'string' && partial.text.startsWith(sent)) {
      const delta = partial.text.slice(sent.length);
      if (delta) {
        emit(delta);
        sent = partial.text;
      }
    }
  });
  const completion = await stream.finalChatCompletion();
  const choice = completion.choices[0];
  if (choice?.finish_reason !== 'stop' || choice.message.refusal) throw Error('invalid_response');
  return choice.message.parsed;
};
