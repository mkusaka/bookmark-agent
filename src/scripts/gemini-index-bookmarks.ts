import { config } from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';
import { createGeminiClient } from '@/lib/gemini/client';
import {
  fetchBookmarkIndexBatch,
  renderBookmarksAsMarkdown,
  splitTextByByteSize,
  type BookmarkIndexCursor,
} from '@/lib/gemini/bookmark-export';

const envLocal = path.resolve(process.cwd(), '.env.local');
const env = path.resolve(process.cwd(), '.env');
config({ path: envLocal });
config({ path: env });

async function waitForOperation(ai: any, operation: any) {
  let op = operation;
  while (!op?.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    op = await ai.operations.get({ operation: op });
  }
  if (op?.error) {
    throw new Error(op.error?.message ?? 'Indexing operation failed');
  }
  return op;
}

async function main() {
  const { values } = parseArgs({
    options: {
      batchSize: { type: 'string', short: 'b' },
      maxDocBytes: { type: 'string' },
      maxBookmarks: { type: 'string' },
      store: { type: 'string', short: 's' },
      displayNamePrefix: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
    strict: true,
  });

  if (values.help) {
    console.log(`
Usage: pnpm gemini:index-bookmarks [options]

Options:
  -s, --store <name>            FileSearchStore name (default: GEMINI_FILE_SEARCH_STORE_NAME)
  -b, --batchSize <n>           DB batch size (default: 200)
      --maxDocBytes <bytes>     Split upload docs by byte size (default: 5000000)
      --maxBookmarks <n>        Stop after indexing N bookmarks (optional)
      --displayNamePrefix <s>   Display name prefix for uploaded docs (default: bookmarks)
  -h, --help

Environment:
  GEMINI_API_KEY=...
  GEMINI_FILE_SEARCH_STORE_NAME=fileSearchStores/...
`);
    process.exit(0);
  }

  const fileSearchStoreName = values.store ?? process.env.GEMINI_FILE_SEARCH_STORE_NAME;
  if (!fileSearchStoreName) {
    console.error('FileSearchStore name is required (set GEMINI_FILE_SEARCH_STORE_NAME or pass --store)');
    process.exit(1);
  }

  const batchSize = values.batchSize ? Number(values.batchSize) : 200;
  const maxDocBytes = values.maxDocBytes ? Number(values.maxDocBytes) : 5_000_000;
  const maxBookmarks = values.maxBookmarks ? Number(values.maxBookmarks) : undefined;
  const displayNamePrefix = values.displayNamePrefix ?? 'bookmarks';

  const ai = createGeminiClient();

  let cursor: BookmarkIndexCursor | undefined;
  let total = 0;
  let docCount = 0;

  while (true) {
    const { items, nextCursor } = await fetchBookmarkIndexBatch({ limit: batchSize, cursor });
    if (items.length === 0) break;

    const remaining =
      typeof maxBookmarks === 'number' ? Math.max(0, maxBookmarks - total) : undefined;
    const slice = typeof remaining === 'number' ? items.slice(0, remaining) : items;

    const markdown = renderBookmarksAsMarkdown(slice);
    const docs = splitTextByByteSize(markdown, maxDocBytes);

    for (const doc of docs) {
      docCount += 1;
      const fileName = `${displayNamePrefix}-${String(docCount).padStart(4, '0')}.md`;
      const blob = new Blob([doc], { type: 'text/markdown' });

      const operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: blob,
        fileSearchStoreName,
        config: { displayName: fileName, mimeType: 'text/markdown' },
      });
      await waitForOperation(ai, operation);
      console.log(`Uploaded: ${fileName}`);
    }

    total += slice.length;
    if (typeof maxBookmarks === 'number' && total >= maxBookmarks) break;
    cursor = nextCursor;
    if (!cursor) break;
  }

  console.log(`Done. Indexed ${total} bookmarks into ${docCount} document(s).`);
  console.log(`Store: ${fileSearchStoreName}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
