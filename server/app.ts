import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { requestSchema, eventSchema } from '../shared/contracts';
import { queue } from '../data/queue';
import { policy } from '../data/policy';
import { Provider } from './provider';
import { handleAI } from './service';
export function createApp(provider?: Provider, timeoutMs = 8000) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/queue', (_req, res) => res.json(queue));
  app.get('/api/policy', (_req, res) => res.json(policy));
  const sessionLimiter = rateLimit({
    windowMs: 60000,
    limit: 12,
    keyGenerator: (req) => req.body.sessionId,
    validate: false,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many AI requests. Please wait one minute.' },
  });
  const ipLimiter = rateLimit({
    windowMs: 60000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait one minute.' },
  });
  app.post(
    '/api/ai',
    ipLimiter,
    (req, res, next) => {
      const result = requestSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: 'Invalid request', issues: result.error.flatten() });
        return;
      }
      req.body = result.data;
      next();
    },
    sessionLimiter,
    async (req, res) => {
      res.status(200).set({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.flushHeaders();
      const controller = new AbortController();
      res.on('close', () => controller.abort());
      const emit = (event: unknown) => {
        if (!res.destroyed && !res.writableEnded)
          res.write(`data: ${JSON.stringify(eventSchema.parse(event))}\n\n`);
      };
      const result = await handleAI(req.body, emit, provider, timeoutMs, controller.signal);
      emit({ type: 'done', answer: result.answer, fallback: result.fallback });
      res.end();
    },
  );
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = (error as { status?: number })?.status;
      res
        .status(status === 413 ? 413 : 400)
        .json({ error: 'Request could not be processed. Check the request body.' });
    },
  );
  return app;
}
