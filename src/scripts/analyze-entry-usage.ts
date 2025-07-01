import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { bookmarks, entries } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function analyzeEntryUsage() {
  console.log('Analyzing entry usage patterns...\n');

  // 1. Total number of entries and bookmarks
  const [entryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries);
  
  const [bookmarkCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarks);

  console.log(`Total entries: ${entryCount.count}`);
  console.log(`Total bookmarks: ${bookmarkCount.count}`);
  console.log(`Ratio (bookmarks/entries): ${(bookmarkCount.count / entryCount.count).toFixed(2)}\n`);

  // 2. How many entries are referenced by multiple bookmarks
  const sharedEntries = await db.execute(sql`
    SELECT 
      e.id,
      e.title,
      e.canonical_url,
      COUNT(b.id) as bookmark_count
    FROM ${entries} e
    JOIN ${bookmarks} b ON e.id = b.entry_id
    GROUP BY e.id, e.title, e.canonical_url
    HAVING COUNT(b.id) > 1
    ORDER BY bookmark_count DESC
    LIMIT 20
  `);

  console.log(`Entries referenced by multiple bookmarks: ${sharedEntries.rows.length}`);
  if (sharedEntries.rows.length > 0) {
    console.log('\nTop shared entries:');
    sharedEntries.rows.forEach((row: any) => {
      console.log(`- "${row.title}" (${row.bookmark_count} bookmarks)`);
      console.log(`  URL: ${row.canonical_url}`);
    });
  }

  // 3. Distribution of bookmark counts per entry
  const distribution = await db.execute(sql`
    SELECT 
      bookmark_count,
      COUNT(*) as entry_count
    FROM (
      SELECT 
        e.id,
        COUNT(b.id) as bookmark_count
      FROM ${entries} e
      LEFT JOIN ${bookmarks} b ON e.id = b.entry_id
      GROUP BY e.id
    ) as counts
    GROUP BY bookmark_count
    ORDER BY bookmark_count
  `);

  console.log('\nDistribution of bookmarks per entry:');
  distribution.rows.forEach((row: any) => {
    console.log(`- ${row.bookmark_count} bookmark(s): ${row.entry_count} entries`);
  });

  // 4. Check for orphaned entries (entries with no bookmarks)
  const orphanedResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM ${entries} e
    LEFT JOIN ${bookmarks} b ON e.id = b.entry_id
    WHERE b.id IS NULL
  `);
  const orphanedEntries = orphanedResult.rows[0] as { count: number };

  console.log(`\nOrphaned entries (no bookmarks): ${orphanedEntries.count}`);

  process.exit(0);
}

analyzeEntryUsage().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});