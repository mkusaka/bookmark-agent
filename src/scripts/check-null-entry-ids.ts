import { config } from 'dotenv';
import path from 'path';
import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { isNull, sql } from 'drizzle-orm';

// Load environment variables from the project root
config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  try {
    console.log('Checking for bookmarks with null entryId values...\n');

    // Count total bookmarks
    const [{ totalCount }] = await db
      .select({ totalCount: sql<number>`count(*)` })
      .from(bookmarks);

    console.log(`Total bookmarks in database: ${totalCount}`);

    // Count bookmarks with null entryId
    const [{ nullCount }] = await db
      .select({ nullCount: sql<number>`count(*)` })
      .from(bookmarks)
      .where(isNull(bookmarks.entryId));

    console.log(`Bookmarks with null entryId: ${nullCount}`);

    if (nullCount > 0) {
      console.log(`\nPercentage with null entryId: ${((nullCount / totalCount) * 100).toFixed(2)}%`);

      // Get a sample of bookmarks with null entryId
      console.log('\nSample of bookmarks with null entryId (first 5):');
      const sampleBookmarks = await db
        .select({
          id: bookmarks.id,
          url: bookmarks.url,
          domain: bookmarks.domain,
          comment: bookmarks.comment,
          bookmarkedAt: bookmarks.bookmarkedAt,
        })
        .from(bookmarks)
        .where(isNull(bookmarks.entryId))
        .limit(5);

      sampleBookmarks.forEach((bookmark, index) => {
        console.log(`\n${index + 1}. Bookmark ID: ${bookmark.id}`);
        console.log(`   URL: ${bookmark.url}`);
        console.log(`   Domain: ${bookmark.domain}`);
        console.log(`   Comment: ${bookmark.comment || '(no comment)'}`);
        console.log(`   Bookmarked at: ${bookmark.bookmarkedAt}`);
      });

      // Group by domain to see which domains have null entryId
      console.log('\n\nTop domains with null entryId:');
      const domainStats = await db
        .select({
          domain: bookmarks.domain,
          count: sql<number>`count(*)`,
        })
        .from(bookmarks)
        .where(isNull(bookmarks.entryId))
        .groupBy(bookmarks.domain)
        .orderBy(sql`count(*) desc`)
        .limit(10);

      domainStats.forEach((stat, index) => {
        console.log(`${index + 1}. ${stat.domain}: ${stat.count} bookmarks`);
      });
    } else {
      console.log('\nGood news! No bookmarks have null entryId values.');
    }

    // Additional check: Count bookmarks with non-null entryId
    const [{ nonNullCount }] = await db
      .select({ nonNullCount: sql<number>`count(*)` })
      .from(bookmarks)
      .where(sql`${bookmarks.entryId} is not null`);

    console.log(`\nBookmarks with non-null entryId: ${nonNullCount}`);

  } catch (error) {
    console.error('Error checking null entry IDs:', error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});