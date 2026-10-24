import { config } from 'dotenv';
import { resolve } from 'node:path';
export function loadEnvironment() {
  // Local overrides are useful when the Next.js project already has a .env.local file.
  config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
  config({ path: resolve(process.cwd(), '.env'), quiet: true });
}
