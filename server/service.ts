import { diagnose } from './diagnostics';
import { AIRequest, answerSchema, Answer, eventSchema, StreamEvent } from '../shared/contracts';
import { buildMessages } from '../prompts/approvals.v1';
import { Provider, openAIProvider } from './provider';
import { queue } from '../data/queue';
export function fallback(input: AIRequest): Answer {
  const notices = {
    English: 'AI is unavailable. This is a local policy fallback. ',
    Hindi: 'AI abhi uplabdh nahi hai. Yeh local policy fallback hai. ',
    Gujarati: 'AI atyare uplabdh nathi. Aa local policy fallback chhe. ',
  };
  let text: string;
  let priorities: Answer['priorities'] = [];
  let sources: Answer['sources'] = [];
  switch (input.action) {
    case 'greeting':
      text = `${queue.length} approvals are pending. You can inspect the queue while AI recovers.`;
      break;
    case 'summary':
      text = `${queue.length} items are pending. Review Safety Equipment & Sensor Specs first as a policy-based recommendation. No actual urgency or deadlines are supplied.`;
      priorities = [
        { id: 'a3', reason: 'Safety-first policy recommendation; not an incident priority.' },
      ];
      sources = ['policy-1'];
      break;
    case 'teach':
      text =
        '1. Open the item. 2. Check title, submitter, revision and supporting evidence. 3. Compare with the checklist. 4. Request changes for missing evidence. 5. An authorised human records the decision and reason.';
      sources = ['policy-2'];
      break;
    default:
      text =
        'I cannot answer your specific question while AI is unavailable. Open the local policy below or contact the site supervisor. No approval status has changed.';
  }
  return answerSchema.parse({ text: notices[input.language] + text, priorities, sources });
}
export async function handleAI(
  input: AIRequest,
  emit: (event: StreamEvent) => void,
  provider: Provider = openAIProvider,
  timeoutMs = 8000,
  externalSignal?: AbortSignal,
) {
  const controller = new AbortController();
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const disconnect = () => controller.abort();
  externalSignal?.addEventListener('abort', disconnect, { once: true });
  const { sources, messages } = buildMessages(input);
  try {
    const raw = await Promise.race([
      provider(
        messages,
        (text) => {
          if (active && !controller.signal.aborted)
            emit(eventSchema.parse({ type: 'delta', text }));
        },
        controller.signal,
      ),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(Error('timeout'));
          controller.abort();
        }, timeoutMs);
      }),
    ]);
    const answer = answerSchema.parse(raw);
    if (answer.sources.some((id) => !sources.some((s) => s.id === id)))
      throw Error('invalid_response');
    if (
      input.action === 'help' &&
      answer.sources.length === 0 &&
      !/unavailable|not (covered|provided|available)|unknown|cannot|नहीं|નથી/i.test(answer.text)
    )
      throw Error('invalid_response');
    return { answer, fallback: false as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const reason =
      message === 'timeout'
        ? 'timeout'
        : message === 'invalid_response' || (err instanceof Error && err.name === 'ZodError')
          ? 'invalid_response'
          : 'unavailable';
    const diagnostic = diagnose(err);
    console.warn('[approvals.ai]', { code: diagnostic.code });
    emit({ type: 'fallback', reason, diagnostic });
    return { answer: fallback(input), fallback: true as const, reason };
  } finally {
    active = false;
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', disconnect);
    controller.abort();
  }
}
