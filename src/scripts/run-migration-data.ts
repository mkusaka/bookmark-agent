import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function migrateEntriesData() {
  console.log('Starting data migration from entries to bookmarks...\n');

  try {
    // First, check if migration is needed
    const checkResult = await db.execute(sql`
      SELECT COUNT(*) as null_count
      FROM bookmarks
      WHERE title IS NULL AND entry_id IS NOT NULL
    `);
    
    const nullCount = parseInt(String(checkResult.rows[0].null_count));
    
    if (nullCount === 0) {
      console.log('✅ No data migration needed - all bookmarks already have titles');
      process.exit(0);
    }
    
    console.log(`📊 Found ${nullCount} bookmarks that need data migration`);
    
    // Perform the migration
    const result = await db.execute(sql`
      UPDATE bookmarks b
      SET 
        title = e.title,
        canonical_url = e.canonical_url,
        root_url = e.root_url,
        summary = e.summary,
        normalized_domain = e.normalized_domain
      FROM entries e
      WHERE b.entry_id = e.id
        AND b.title IS NULL
    `);
    
    console.log(`✅ Successfully migrated data for ${result.rowCount} bookmarks`);
    
    // Verify migration
    const verifyResult = await db.execute(sql`
      SELECT COUNT(*) as remaining_nulls
      FROM bookmarks
      WHERE title IS NULL AND entry_id IS NOT NULL
    `);
    
    const remainingNulls = parseInt(String(verifyResult.rows[0].remaining_nulls));
    
    if (remainingNulls > 0) {
      console.error(`⚠️  Warning: ${remainingNulls} bookmarks still have NULL titles`);
    } else {
      console.log('✅ All bookmarks with entry_id now have titles');
    }
    
  } catch (error) {
    console.error('❌ Error during data migration:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateEntriesData();