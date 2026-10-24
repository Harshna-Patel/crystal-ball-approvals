# Approvals Assistant

A queue assistant built with Next.js, Express and GPT-4o. It supports queue summaries, multi-turn conversation, policy questions, guided review and regenerated greetings.

## Setup

Requirements: Node.js 20.9+, npm, and an OpenAI API key with model access and API credits.

```bash
npm ci
```

Create a root `.env` from `.env.example`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Set `OPENAI_API_KEY`, keep `OPENAI_MODEL=gpt-4o`, and leave `AI_FORCE_TIMEOUT=false`. The Express server reads `.env.local` first, then `.env`; existing system environment values take precedence. Restart the server after changing configuration. Never commit either environment file.

```bash
npm run check:ai
npm run dev
```

Open http://127.0.0.1:3000. Express listens on port 4000 and Next proxies `/api/*` to it. Changing the API port also requires updating `next.config.mjs`. Backend edits require a process restart; frontend edits hot reload.

`check:ai` makes the same structured streaming call as the app. With a valid key, it uses API credits. Failures print a safe diagnostic code, not credentials or raw provider errors. The chat also displays the actionable explanation while retaining local fallback guidance.

## Validation

```bash
npm test
npm run typecheck
npm run format:check
npm run build
npm start
```

Stop development before building or starting production. `npm start` requires a successful build. Jest/Supertest cover backend behaviour; Vitest/Testing Library cover loading, streaming, network failures and provider fallback. Automated tests mock the provider and do not require credits.


