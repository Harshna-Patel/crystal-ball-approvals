import { z } from 'zod';
export const diagnosticSchema = z.object({
  code: z.enum([
    'missing_key',
    'invalid_key',
    'quota_exceeded',
    'rate_limited',
    'model_unavailable',
    'permission_denied',
    'request_rejected',
    'timeout',
    'invalid_response',
    'connection_failed',
    'provider_unavailable',
  ]),
  message: z.string(),
});
export type Diagnostic = z.infer<typeof diagnosticSchema>;
