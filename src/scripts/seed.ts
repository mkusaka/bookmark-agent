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

  console.log(`Starting import for user: ${hatenaUserId}`);
  
  // Dynamic import after env vars are loaded
  const { HatenaBookmarkImporter } = await import('@/lib/hatena/importer');
  const importer = new HatenaBookmarkImporter();
  
  try {
    const totalImported = await importer.importUserBookmarks(hatenaUserId);
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