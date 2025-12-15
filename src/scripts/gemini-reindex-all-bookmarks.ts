import { config } from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';
import { desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { syncBookmarkToGeminiFileSearchStore } from '@/lib/gemini/bookmark-sync';

const envLocal = path.resolve(process.cwd(), '.env.local');
const env = path.resolve(process.cwd(), '.env');
config({ path: envLocal });
config({ path: env });

async function main() {
  const { values } = parseArgs({
    options: {
      limit: { type: 'string', short: 'l' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
    strict: true,
  });

  if (values.help) {
    console.log(`
Usage: pnpm gemini:reindex-all [options]

Options:
  -l, --limit <n>   Limit number of bookmarks (optional)
  -h, --help

Environment:
  GEMINI_API_KEY=...
  GEMINI_FILE_SEARCH_STORE_NAME=fileSearchStores/...
`);
    process.exit(0);
  }

  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_FILE_SEARCH_STORE_NAME) {
    throw new Error('GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required');
  }

  const limit = values.limit ? Number(values.limit) : undefined;
  if (values.limit && (!Number.isFinite(limit!) || limit! <= 0)) {
    throw new Error('Invalid --limit');
  }

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(bookmarks);
  const total = Number(totalRow[0]?.count ?? 0);
  const target = typeof limit === 'number' ? Math.min(limit, total) : total;

  console.log(`Gemini reindex start: ${target}/${total} bookmarks`);

  const batchSize = 100;
  let processed = 0;
  let offset = 0;

  while (processed < target) {
    const batch = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .orderBy(desc(bookmarks.bookmarkedAt), desc(bookmarks.id))
      .limit(Math.min(batchSize, target - processed))
      .offset(offset);

    if (batch.length === 0) break;

    for (const row of batch) {
      await syncBookmarkToGeminiFileSearchStore(row.id);
      processed += 1;
      if (processed % 25 === 0) {
        console.log(`Processed ${processed}/${target}...`);
      }
    }

    offset += batch.length;
  }

  console.log(`Gemini reindex done: ${processed}/${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
