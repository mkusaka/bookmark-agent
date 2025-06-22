import { config } from 'dotenv';
import path from 'path';

// Load environment variables from the project root
config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const hatenaUserId = process.env.HATENA_USER_ID;
  
  if (!hatenaUserId) {
    console.error('HATENA_USER_ID environment variable is required');
    process.exit(1);
  }

  // Get command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const totalArg = args.find(arg => arg.startsWith('--total='));
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const totalCount = totalArg ? parseInt(totalArg.split('=')[1], 10) : undefined;

  if (limit && isNaN(limit)) {
    console.error('Invalid limit value. Must be a number.');
    process.exit(1);
  }

  if (totalCount && isNaN(totalCount)) {
    console.error('Invalid total value. Must be a number.');
    process.exit(1);
  }

  console.log(`Starting import for user: ${hatenaUserId}`);
  if (limit && totalCount) {
    console.log(`Total bookmarks: ${totalCount}, limiting to ${limit} oldest bookmarks`);
  } else if (limit) {
    console.log(`Limiting to ${limit} bookmarks`);
  }
  
  // Dynamic import after env vars are loaded
  const { HatenaBookmarkImporter } = await import('@/lib/hatena/importer');
  const importer = new HatenaBookmarkImporter();
  
  try {
    const totalImported = await importer.importUserBookmarks(hatenaUserId, limit, totalCount);
    console.log(`Successfully imported ${totalImported} bookmarks`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});