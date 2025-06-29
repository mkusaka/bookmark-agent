import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { tags, bookmarkTags } from '../src/db/schema';
import { sql } from 'drizzle-orm';

const connectionString = process.env.NODE_ENV === 'production' 
  ? process.env.DATABASE_URL 
  : process.env.LOCAL_DATABASE_URL;

if (!connectionString) {
  throw new Error('Database connection string is not defined');
}

const pool = new Pool({
  connectionString,
});

const db = drizzle(pool, { schema: { tags, bookmarkTags } });

async function countTags() {
  console.log('📊 Tag Count Analysis\n');

  // 1. Count total tags in database
  const allTags = await db.select().from(tags).orderBy(tags.label);
  console.log(`Total tags in database: ${allTags.length}`);

  // 2. Count tags actually used in bookmarks
  const usedTagsResult = await db
    .select({
      tagId: bookmarkTags.tagId,
      count: sql<number>`count(*)`.as('count')
    })
    .from(bookmarkTags)
    .groupBy(bookmarkTags.tagId);

  console.log(`Tags actually used in bookmarks: ${usedTagsResult.length}`);

  // 3. Find unused tags
  const usedTagIds = new Set(usedTagsResult.map(t => t.tagId));
  const unusedTags = allTags.filter(tag => !usedTagIds.has(tag.id));

  console.log(`\nUnused tags (${unusedTags.length}):`);
  if (unusedTags.length > 0) {
    unusedTags.forEach(tag => {
      console.log(`  - ${tag.label} (ID: ${tag.id})`);
    });
  }

  // 4. Show usage statistics for used tags
  console.log('\n📈 Tag Usage Statistics:');
  
  const tagUsageMap = new Map(usedTagsResult.map(t => [t.tagId, t.count]));
  const tagStats = allTags
    .filter(tag => usedTagIds.has(tag.id))
    .map(tag => ({
      label: tag.label,
      count: tagUsageMap.get(tag.id) || 0
    }))
    .sort((a, b) => b.count - a.count);

  console.log('\nTop 10 most used tags:');
  tagStats.slice(0, 10).forEach((tag, index) => {
    console.log(`  ${index + 1}. ${tag.label}: ${tag.count} bookmarks`);
  });

  console.log('\nBottom 10 least used tags (excluding unused):');
  tagStats.slice(-10).reverse().forEach((tag, index) => {
    console.log(`  ${index + 1}. ${tag.label}: ${tag.count} bookmarks`);
  });

  // 5. Count total bookmarks
  const totalBookmarksResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarkTags);
  
  const totalBookmarkTags = totalBookmarksResult[0]?.count || 0;
  console.log(`\n📚 Total bookmark-tag relationships: ${totalBookmarkTags}`);

  await pool.end();
  process.exit(0);
}

countTags().catch(console.error);