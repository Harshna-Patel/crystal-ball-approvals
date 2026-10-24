import { loadEnvironment } from './env';
loadEnvironment();
import { createApp } from './app';
if (!process.env.OPENAI_API_KEY)
  console.warn(
    '[approvals.ai] OPENAI_API_KEY is missing. Run npm run check:ai after configuring .env.',
  );
const port = Number(process.env.PORT || 4000);
const timeout = Number(process.env.AI_TIMEOUT_MS || 8000);
if (!Number.isFinite(timeout) || timeout < 1 || timeout > 8000)
  throw Error('AI_TIMEOUT_MS must be between 1 and 8000');
createApp(undefined, timeout).listen(port, '127.0.0.1', () =>
  console.log(`API: http://127.0.0.1:${port}`),
);
