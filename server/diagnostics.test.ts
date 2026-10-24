import { diagnose, ConfigurationError } from './diagnostics';
import { zodResponseFormat } from 'openai/helpers/zod';
import { providerAnswerSchema, answerSchema } from '../shared/contracts';
test.each([
  [new ConfigurationError('missing_key'), 'missing_key'],
  [{ status: 401 }, 'invalid_key'],
  [{ status: 429, code: 'insufficient_quota' }, 'quota_exceeded'],
  [{ status: 429 }, 'rate_limited'],
  [{ status: 404 }, 'model_unavailable'],
  [{ status: 403 }, 'permission_denied'],
  [{ status: 400 }, 'request_rejected'],
  [new Error('timeout'), 'timeout'],
  [{ name: 'APIConnectionError' }, 'connection_failed'],
  [new Error('invalid_response'), 'invalid_response'],
])('maps failures to safe actionable messages', (error, code) => {
  expect(diagnose(error).code).toBe(code);
});
test('does not expose provider raw errors or secrets', () => {
  const result = diagnose({ status: 401, message: 'sk-private-secret' });
  expect(JSON.stringify(result)).not.toContain('sk-private-secret');
});
test('provider schema omits length keywords but final validation still enforces limits', () => {
  const schema = JSON.stringify(
    zodResponseFormat(providerAnswerSchema, 'approval_answer').json_schema.schema,
  );
  expect(schema).not.toMatch(/minLength|maxLength|maxItems/);
  expect(answerSchema.safeParse({ text: '', priorities: [], sources: [] }).success).toBe(false);
});
