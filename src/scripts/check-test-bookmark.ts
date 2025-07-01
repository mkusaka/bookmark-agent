import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function checkTestBookmark() {
  console.log('Checking test bookmark after migration...\n');

  try {
    const testBookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.url, 'https://example.com/test'),
    });

    if (!testBookmark) {
      console.error('Test bookmark not found');
      process.exit(1);
    }

    console.log('Test bookmark data:');
    console.log(`  ID: ${testBookmark.id}`);
    console.log(`  Comment: ${testBookmark.comment}`);
    console.log(`  URL: ${testBookmark.url}`);
    console.log('\nMigrated fields:');
    console.log(`  Title: ${testBookmark.title}`);
    console.log(`  Canonical URL: ${testBookmark.canonicalUrl}`);
    console.log(`  Root URL: ${testBookmark.rootUrl}`);
    console.log(`  Summary: ${testBookmark.summary}`);
    console.log(`  Normalized Domain: ${testBookmark.normalizedDomain}`);

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkTestBookmark();