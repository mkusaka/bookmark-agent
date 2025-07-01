import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function checkMigrationData() {
  console.log('Checking migrated data...\n');

  try {
    // Raw SQL query to check the data
    const result = await db.execute(sql`
      SELECT 
        b.id,
        b.title,
        b.canonical_url,
        b.root_url,
        b.summary,
        b.normalized_domain,
        b.url,
        b.domain,
        b.comment,
        e.title as entry_title,
        e.canonical_url as entry_canonical_url,
        e.normalized_domain as entry_normalized_domain
      FROM bookmarks b
      LEFT JOIN entries e ON b.entry_id = e.id
      LIMIT 3
    `);

    console.log('Sample bookmark data with entry comparison:');
    result.rows.forEach((row: any, index: number) => {
      console.log(`\n📌 Bookmark ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  URL: ${row.url}`);
      console.log(`  Comment: ${row.comment}`);
      console.log(`  --- Migrated fields ---`);
      console.log(`  Title: ${row.title || '(NULL)'}`);
      console.log(`  Canonical URL: ${row.canonical_url || '(NULL)'}`);
      console.log(`  Normalized Domain: ${row.normalized_domain || '(NULL)'}`);
      console.log(`  Summary: ${row.summary || '(NULL)'}`);
      console.log(`  --- Original entry data ---`);
      console.log(`  Entry Title: ${row.entry_title || '(NULL)'}`);
      console.log(`  Entry Canonical URL: ${row.entry_canonical_url || '(NULL)'}`);
      console.log(`  Entry Normalized Domain: ${row.entry_normalized_domain || '(NULL)'}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  }

  process.exit(0);
}

checkMigrationData();