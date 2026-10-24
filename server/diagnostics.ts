import { Diagnostic } from '../shared/diagnostics';
export class ConfigurationError extends Error { }
export function diagnose(error: unknown): Diagnostic {
  const e = error as { status?: number; code?: string; name?: string; message?: string };
  const details = error as {
    status?: number;
    code?: string;
    type?: string;
  };

  console.warn('OpenAI error details:', {
    status: details.status,
    code: details.code,
    type: details.type,
  });
  if (error instanceof ConfigurationError)
    return {
      code: 'missing_key',
      message: 'Set OPENAI_API_KEY in the project root .env file, then restart the server.',
    };
  if (e?.message === 'timeout')
    return {
      code: 'timeout',
      message: 'The AI request exceeded the 8-second limit. Try a shorter question.',
    };
  if (e?.status === 401)
    return {
      code: 'invalid_key',
      message: 'OpenAI rejected the API key. Replace it in .env and restart the server.',
    };
  if (e?.code === 'insufficient_quota' || e?.code === 'billing_hard_limit_reached')
    return {
      code: 'quota_exceeded',
      message:
        'OpenAI API credits or billing quota are exhausted. Check API Billing; a ChatGPT subscription does not fund API usage.',
    };
  if (e?.status === 429)
    return { code: 'rate_limited', message: 'OpenAI rate limit reached. Wait briefly and retry.' };
  if (e?.status === 404)
    return {
      code: 'model_unavailable',
      message:
        'The configured model is unavailable to this API project. Check OPENAI_MODEL and project access.',
    };
  if (e?.status === 403)
    return {
      code: 'permission_denied',
      message: 'The API project or key does not have permission to use this model.',
    };
  if (e?.status === 400)
    return {
      code: 'request_rejected',
      message:
        'OpenAI rejected the request format. Run npm run check:ai and check the server configuration.',
    };
  if (
    e?.name === 'ZodError' ||
    e?.message === 'invalid_response' ||
    e?.name === 'LengthFinishReasonError'
  )
    return {
      code: 'invalid_response',
      message: 'The AI response did not pass validation. Please retry.',
    };
  if (e?.name === 'APIConnectionError' || e?.name === 'APIConnectionTimeoutError')
    return {
      code: 'connection_failed',
      message:
        'The server could not connect to OpenAI. Check your internet connection, proxy or firewall.',
    };
  return {
    code: 'provider_unavailable',
    message: 'The AI provider is currently unavailable. Please retry.',
  };
}
