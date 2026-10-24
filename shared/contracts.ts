import { diagnosticSchema } from './diagnostics';
import { z } from 'zod';
export const actionSchema = z.enum(['summary', 'talk', 'help', 'teach', 'greeting']);
export type Action = z.infer<typeof actionSchema>;
export const requestSchema = z
  .object({
    sessionId: z.string().uuid(),
    action: actionSchema,
    language: z.enum(['English', 'Hindi', 'Gujarati']).default('English'),
    question: z.string().trim().max(1500).default(''),
    history: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(6000) }))
      .max(12)
      .default([]),
  })
  .strict();
export type AIRequest = z.infer<typeof requestSchema>;
export const answerSchema = z
  .object({
    text: z.string().min(1).max(6000),
    priorities: z
      .array(
        z
          .object({ id: z.enum(['a1', 'a2', 'a3', 'a4']), reason: z.string().min(1).max(800) })
          .strict(),
      )
      .max(4),
    sources: z.array(z.enum(['policy-1', 'policy-2', 'policy-3', 'policy-4'])).max(4),
  })
  .strict();
export type Answer = z.infer<typeof answerSchema>;
export const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), text: z.string().max(6000) }),
  z.object({ type: z.literal('done'), answer: answerSchema, fallback: z.boolean() }),
  z.object({
    type: z.literal('fallback'),
    reason: z.enum(['timeout', 'unavailable', 'invalid_response']),
    diagnostic: diagnosticSchema.optional(),
  }),
]);
export type StreamEvent = z.infer<typeof eventSchema>;

// Provider schema uses the common JSON Schema subset; stricter limits remain in answerSchema.
export const providerAnswerSchema = z
  .object({
    text: z.string(),
    priorities: z.array(
      z.object({ id: z.enum(['a1', 'a2', 'a3', 'a4']), reason: z.string() }).strict(),
    ),
    sources: z.array(z.enum(['policy-1', 'policy-2', 'policy-3', 'policy-4'])),
  })
  .strict();
