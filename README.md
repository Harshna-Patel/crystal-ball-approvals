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

## Design

The fixture contains the four supplied queue items. `data/policy.ts` contains a self-authored four-chunk approval policy and keyword retrieval. Low-overlap questions use the whole short policy. Conversation history informs retrieval. Zustand holds session and chat state in memory; refresh resets it.

Requests, final answers and SSE events have Zod contracts. The provider JSON schema uses a conservative common subset; the server separately enforces text length, item count and source constraints. Versioned prompts live in `prompts/`. The API key stays server-side.

Text deltas come from the OpenAI SDK's incremental structured parser. They are provisional until the full response passes validation. Priorities and citations render after completion. Failure clears partial text and replaces it with explicitly labelled fallback. There is no simulated typewriter stream.

All provider calls have an eight-second deadline, cancellation and no automatic retries. The browser has a fifteen-second transport limit. Basic limits allow twelve requests/minute/session and sixty/minute/IP. These are single-process demo limits, not authentication.

## AI judgment and fallback design

AI is useful for interpreting free-form operational questions, summarising several queue items in the operator’s language, and adapting teaching steps to follow-up questions. These capabilities benefit from language reasoning rather than a growing set of canned answers. Each of the five entry points therefore calls GPT-4o on the server, including greeting regeneration, as requested by the assessment.

AI is unnecessary for listing pending items, counting them, filtering the table, enforcing the request contract, enforcing policy source identifiers, and recording an approval decision. Those responsibilities remain deterministic. A greeting could normally be a template; here its LLM call demonstrates the specified behaviour. Actual approval mutations are deliberately absent because the supplied scope is an advisory panel with fixture data.

Every provider request has an eight-second timeout and no automatic retries. Missing credentials, provider errors, malformed responses and timeouts switch to an explicitly labelled local fallback. Partial streamed output is discarded, so a failed generation cannot look complete. Summary and teaching have policy-based deterministic alternatives; free-form answers state that AI is unavailable rather than pretending to answer. Rate limits return a visible retry message.

With more time, I would add a retrieval evaluation set covering multilingual paraphrases and unsupported questions, then tune retrieval from that evidence before adding a vector database. I would also measure first-token latency and fallback rates in production.

## Assumptions

- Fixture data is permitted, so no MongoDB connection or approval persistence is included.
- No severity, deadline or year is supplied. Safety-first review order is a policy recommendation, not an invented urgency field.
- Text interaction is implemented. Speech recognition and synthesis are outside this version.
- English, Hindi and Gujarati are requested through the prompt. Local fallback has a translated notice and English operational guidance.
- The panel follows the reference structure, with CSS icons instead of unavailable original character artwork.
- Policy citations validate identifiers, not semantic truth. Grounding still needs evaluation; the current empty-source abstention check is a limited language heuristic.
- Client session IDs are not user authentication. Deployment would need authenticated sessions, distributed throttling, trusted proxy configuration and appropriate secret management.

## Manual review

Run each action with a valid API key. Try a follow-up question, a policy question, an unsupported question, language changes and network disconnection. Set `AI_FORCE_TIMEOUT=true` and restart to demonstrate the eight-second timeout, then restore false. This flag deliberately bypasses the real provider call.

The current automated checks and remaining limits are recorded in `verification/RESULTS.md`. Real provider success and browser visual QA are not claimed without testing them.

## AI assistance

OpenAI ChatGPT assisted with scaffolding, implementation, tests, documentation and debugging. The Git bundle preserves the actual development history, including the initial contract/test scaffold and subsequent fixes. Review and understand the implementation before presenting it.
