import { config } from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';
import { createGeminiClient } from '@/lib/gemini/client';

const envLocal = path.resolve(process.cwd(), '.env.local');
const env = path.resolve(process.cwd(), '.env');
config({ path: envLocal });
config({ path: env });

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      name: { type: 'string', short: 'n' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help) {
    console.log(`
Usage: pnpm gemini:create-store [--name <displayName>]

Environment:
  GEMINI_API_KEY=...
`);
    process.exit(0);
  }

  const displayName = values.name ?? positionals[0] ?? 'bookmark-agent';

  const ai = createGeminiClient();
  const store = await ai.fileSearchStores.create({
    config: { displayName },
  });

  console.log('Created FileSearchStore:');
  console.log(`  name: ${store.name}`);
  console.log('');
  console.log('Next: set this env var:');
  console.log(`  GEMINI_FILE_SEARCH_STORE_NAME=${store.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
