import { config } from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';

// Load environment variables from the project root
// Prefer .env.local, then fall back to .env
const envLocal = path.resolve(process.cwd(), '.env.local');
const env = path.resolve(process.cwd(), '.env');
config({ path: envLocal });
config({ path: env });

async function main() {
  const hatenaUserId = process.env.HATENA_USER_ID;
  
  if (!hatenaUserId) {
    console.error('HATENA_USER_ID environment variable is required');
    process.exit(1);
  }

  // Parse command line arguments
  const { values } = parseArgs({
    options: {
      limit: {
        type: 'string',
        short: 'l',
      },
      skip: {
        type: 'string',
        short: 's',
      },
      total: {
        type: 'string',
        short: 't',
      },
      clean: {
        type: 'boolean',
        short: 'c',
      },
      'list-store': {
        type: 'boolean',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    console.log(`
Usage: pnpm db:seed [options]

Options:
  -l, --limit <number>  Limit the number of bookmarks to import
  -s, --skip <number>   Skip the first N bookmarks
  -t, --total <number>  Total number of bookmarks (used with --limit to import oldest bookmarks)
  -c, --clean          Clean Gemini File Store before import (delete all documents and reset DB)
      --list-store     List all documents in Gemini File Store (no import)
  -h, --help           Show help

Examples:
  pnpm db:seed                        # Import all bookmarks
  pnpm db:seed --limit 100            # Import the newest 100 bookmarks
  pnpm db:seed --skip 50 --limit 100  # Skip 50, then import 100 bookmarks
  pnpm db:seed -l 100 -t 5000         # Import the oldest 100 bookmarks from 5000 total
  pnpm db:seed --clean                # Clean File Store and re-import all bookmarks
  pnpm db:seed --list-store           # List documents in File Store
`);
    process.exit(0);
  }

  const limit = values.limit ? parseInt(values.limit, 10) : undefined;
  const skip = values.skip ? parseInt(values.skip, 10) : undefined;
  const totalCount = values.total ? parseInt(values.total, 10) : undefined;

  if (limit && isNaN(limit)) {
    console.error('Invalid limit value. Must be a number.');
    process.exit(1);
  }

  if (skip && isNaN(skip)) {
    console.error('Invalid skip value. Must be a number.');
    process.exit(1);
  }

  if (totalCount && isNaN(totalCount)) {
    console.error('Invalid total value. Must be a number.');
    process.exit(1);
  }

  // Handle --list-store option
  if (values['list-store']) {
    const fileSearchStoreName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!fileSearchStoreName || !apiKey) {
      console.error('GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required for --list-store');
      process.exit(1);
    }

    console.log(`Listing documents in File Store: ${fileSearchStoreName}\n`);

    const { createGeminiClient } = await import('@/lib/gemini/client');
    const ai = createGeminiClient();

    let count = 0;
    try {
      const documentsPager = await ai.fileSearchStores.documents.list({
        parent: fileSearchStoreName,
        config: { pageSize: 20 },
      });

      for await (const doc of documentsPager) {
        count++;
        console.log(`[${count}] ${doc.displayName || '(no name)'}`);
        console.log(`    name: ${doc.name}`);
        console.log(`    mimeType: ${doc.mimeType}`);
        console.log(`    createTime: ${doc.createTime}`);
        if (doc.customMetadata && doc.customMetadata.length > 0) {
          console.log('    customMetadata:');
          for (const meta of doc.customMetadata) {
            const value = meta.stringValue ?? meta.numericValue ?? JSON.stringify(meta.stringListValue);
            console.log(`      ${meta.key}: ${value}`);
          }
        }
        console.log('');
      }

      console.log(`Total: ${count} documents`);
    } catch (e) {
      console.error('Failed to list documents:', e);
      process.exit(1);
    }

    process.exit(0);
  }

  // Handle --clean option
  if (values.clean) {
    const fileSearchStoreName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!fileSearchStoreName || !apiKey) {
      console.error('GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required for --clean');
      process.exit(1);
    }

    console.log('Cleaning Gemini File Store...');

    const { createGeminiClient } = await import('@/lib/gemini/client');
    const { db } = await import('@/db');
    const { bookmarks } = await import('@/db/schema');

    const ai = createGeminiClient();

    // List and delete all documents in the File Store
    let deletedCount = 0;
    try {
      const documentsPager = await ai.fileSearchStores.documents.list({
        parent: fileSearchStoreName,
        config: { pageSize: 20 },
      });

      for await (const doc of documentsPager) {
        if (doc.name) {
          try {
            await ai.fileSearchStores.documents.delete({
              name: doc.name,
              config: { force: true },
            });
            deletedCount++;
            if (deletedCount % 10 === 0) {
              console.log(`Deleted ${deletedCount} documents...`);
            }
          } catch (e) {
            console.warn(`Failed to delete document ${doc.name}:`, e);
          }
        }
      }
      console.log(`Deleted ${deletedCount} documents from File Store`);
    } catch (e) {
      console.warn('Failed to list documents (store may be empty):', e);
    }

    // Reset Gemini-related columns in DB
    const { sql } = await import('drizzle-orm');
    await db.update(bookmarks).set({
      geminiDocumentName: null,
      geminiFileSearchStoreName: null,
      geminiContentHash: null,
      geminiIndexedAt: null,
    });
    console.log('Reset Gemini columns in database');
  }

  console.log(`Starting import for user: ${hatenaUserId}`);
  if (limit && totalCount) {
    console.log(`Total bookmarks: ${totalCount}, limiting to ${limit} oldest bookmarks`);
  } else if (skip && limit) {
    console.log(`Skipping ${skip} bookmarks, then importing ${limit} bookmarks`);
  } else if (skip) {
    console.log(`Skipping ${skip} bookmarks, then importing all remaining`);
  } else if (limit) {
    console.log(`Limiting to ${limit} bookmarks`);
  }

  // Dynamic import after env vars are loaded
  const { HatenaBookmarkImporter } = await import('@/lib/hatena/importer');
  const importer = new HatenaBookmarkImporter();
  
  try {
    const result = await importer.importUserBookmarks(hatenaUserId, limit, totalCount, skip);
    console.log(
      `Completed. imported=${result.imported}, updated=${result.updated}, skipped=${result.skipped}`
    );
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
