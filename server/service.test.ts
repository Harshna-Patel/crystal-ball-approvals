import { handleAI } from './service';
import { answerSchema, AIRequest } from '../shared/contracts';
const input: AIRequest = {
  sessionId: 'c67bf59d-b40b-411a-bf37-7b0001472f12',
  action: 'help',
  question: 'How do I review safety equipment?',
  language: 'English',
  history: [],
};
const valid = { text: 'Check certificates.', priorities: [], sources: ['policy-1'] };
test('handler passes grounded prompt to mocked LLM and validates final answer', async () => {
  const provider = jest.fn(async (_m, emit) => {
    emit('Check');
    return valid;
  });
  const out = await handleAI(input, () => {}, provider, 100);
  expect(out.fallback).toBe(false);
  expect(answerSchema.safeParse(out.answer).success).toBe(true);
  expect(provider.mock.calls[0][0][0].content).toContain('policy-1');
});
test('malformed model output becomes explicit deterministic fallback', async () => {
  const out = await handleAI(
    input,
    () => {},
    async () => ({ text: 77 }),
    100,
  );
  expect(out.fallback).toBe(true);
  expect(out.reason).toBe('invalid_response');
});
test('rejects fabricated source IDs even if schema-shaped', async () => {
  const out = await handleAI(
    { ...input, question: 'drone video' },
    () => {},
    async () => ({ ...valid, sources: ['policy-1'] }),
    100,
  );
  expect(out.fallback).toBe(true);
});
