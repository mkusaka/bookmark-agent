import { config } from 'dotenv';
import path from 'path';
import { parseArgs } from 'util';

// Load environment variables from the project root
config({ path: path.resolve(process.cwd(), '.env') });

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
  -h, --help           Show help

Examples:
  pnpm db:seed                        # Import all bookmarks
  pnpm db:seed --limit 100            # Import the newest 100 bookmarks
  pnpm db:seed --skip 50 --limit 100  # Skip 50, then import 100 bookmarks
  pnpm db:seed -l 100 -t 5000         # Import the oldest 100 bookmarks from 5000 total
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
