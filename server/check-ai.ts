import { loadEnvironment } from './env';
import { handleAI } from './service';
loadEnvironment();
async function main() {
  console.log(
    'Checking the same structured streaming request used by the app. This uses API credits when a valid key is configured.',
  );
  let diagnostic: unknown;
  let deltaCount = 0;
  const result = await handleAI(
    {
      sessionId: 'c67bf59d-b40b-411a-bf37-7b0001472f12',
      action: 'greeting',
      language: 'English',
      question: '',
      history: [],
    },
    (event) => {
      if (event.type === 'fallback') diagnostic = event.diagnostic;
      if (event.type === 'delta') deltaCount++;
    },
  );
  if (result.fallback) {
    console.error('AI check failed:', diagnostic);
    process.exitCode = 1;
    return;
  }
  console.log('AI check passed.', { streamedChunks: deltaCount, text: result.answer.text });
}
main().catch(() => {
  console.error('AI check could not complete.');
  process.exitCode = 1;
});
