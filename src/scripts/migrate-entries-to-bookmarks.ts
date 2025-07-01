#!/usr/bin/env tsx
import { db } from '@/db';
import { bookmarks, entries } from '@/db/schema';
import { sql } from 'drizzle-orm';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function analyzeCurrentState() {
  console.log('🔍 Analyzing current database state...\n');

  // Total counts
  const [entryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries);
  
  const [bookmarkCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarks);

  console.log(`📊 Database Statistics:`);
  console.log(`   - Total entries: ${entryCount.count}`);
  console.log(`   - Total bookmarks: ${bookmarkCount.count}`);

  // Check for shared entries
  const sharedEntries = await db.execute(sql`
    SELECT COUNT(DISTINCT e.id) as count
    FROM ${entries} e
    JOIN ${bookmarks} b ON e.id = b.entry_id
    GROUP BY e.id
    HAVING COUNT(b.id) > 1
  `);

  console.log(`   - Entries shared by multiple bookmarks: ${sharedEntries.rows.length}`);

  // Check for orphaned entries
  const orphanedResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM ${entries} e
    LEFT JOIN ${bookmarks} b ON e.id = b.entry_id
    WHERE b.id IS NULL
  `);
  const orphanedEntries = orphanedResult.rows[0] as { count: number };

  console.log(`   - Orphaned entries (no bookmarks): ${orphanedEntries.count}\n`);

  return {
    entryCount: entryCount.count,
    bookmarkCount: bookmarkCount.count,
    sharedEntriesCount: sharedEntries.rows.length,
    orphanedEntriesCount: orphanedEntries.count,
  };
}

async function phase1AddColumns() {
  console.log('📝 Phase 1: Adding new columns to bookmarks table...\n');

  try {
    // Check if columns already exist
    const existingColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookmarks' 
      AND column_name IN ('title', 'canonical_url', 'root_url', 'summary', 'normalized_domain')
    `);

    if (existingColumns.rows.length > 0) {
      console.log('⚠️  Some columns already exist. Skipping column addition.');
      console.log('   Existing columns:', existingColumns.rows.map((r: any) => r.column_name).join(', '));
      return;
    }

    // Add new columns
    await db.execute(sql`
      ALTER TABLE bookmarks 
      ADD COLUMN title TEXT,
      ADD COLUMN canonical_url TEXT,
      ADD COLUMN root_url TEXT,
      ADD COLUMN summary TEXT,
      ADD COLUMN normalized_domain TEXT
    `);

    console.log('✅ Columns added successfully!\n');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  }
}

async function phase2CopyData() {
  console.log('📋 Phase 2: Copying data from entries to bookmarks...\n');

  try {
    // Update bookmarks with entry data
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
    `);

    console.log(`✅ Updated ${result.rowCount} bookmarks with entry data!\n`);

    // Check for any bookmarks without entry data
    const [missingData] = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM bookmarks
      WHERE title IS NULL AND entry_id IS NOT NULL
    `);

    if (missingData.count > 0) {
      console.log(`⚠️  Warning: ${missingData.count} bookmarks have entry_id but no copied data`);
    }
  } catch (error) {
    console.error('❌ Error copying data:', error);
    throw error;
  }
}

async function phase3AddIndexes() {
  console.log('🔧 Phase 3: Adding indexes to new columns...\n');

  try {
    const indexes = [
      { name: 'bookmarks_normalized_domain_idx', column: 'normalized_domain' },
      { name: 'bookmarks_title_trgm_idx', column: 'title', type: 'gin', ops: 'gin_trgm_ops' },
      { name: 'bookmarks_summary_trgm_idx', column: 'summary', type: 'gin', ops: 'gin_trgm_ops' },
    ];

    for (const index of indexes) {
      console.log(`Creating index: ${index.name}...`);
      
      if (index.type === 'gin') {
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS ${sql.identifier(index.name)}
          ON bookmarks USING gin (${sql.identifier(index.column)} ${sql.raw(index.ops!)})
        `);
      } else {
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS ${sql.identifier(index.name)}
          ON bookmarks (${sql.identifier(index.column)})
        `);
      }
    }

    console.log('✅ All indexes created successfully!\n');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  // Check that all bookmarks have the new data
  const [completeBookmarks] = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM bookmarks
    WHERE title IS NOT NULL
    AND canonical_url IS NOT NULL
    AND normalized_domain IS NOT NULL
  `);

  const [totalBookmarks] = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM bookmarks
  `);

  console.log(`✅ Migration verification:`);
  console.log(`   - Bookmarks with complete data: ${completeBookmarks.count}/${totalBookmarks.count}`);

  if (completeBookmarks.count === totalBookmarks.count) {
    console.log('   - ✅ All bookmarks have been successfully migrated!\n');
    return true;
  } else {
    console.log('   - ⚠️  Some bookmarks are missing data\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Bookmark-Entry Table Migration Tool\n');
  console.log('This tool will migrate entry data into the bookmarks table.\n');

  try {
    // Analyze current state
    const state = await analyzeCurrentState();

    if (state.bookmarkCount === 0) {
      console.log('ℹ️  No bookmarks found in the database. Nothing to migrate.');
      process.exit(0);
    }

    // Confirm before proceeding
    const answer = await question('Do you want to proceed with the migration? (yes/no): ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Execute migration phases
    await phase1AddColumns();
    await phase2CopyData();
    await phase3AddIndexes();

    // Verify migration
    const success = await verifyMigration();

    if (success) {
      console.log('🎉 Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update the schema.ts file to include the new columns');
      console.log('2. Update application code to use the new structure');
      console.log('3. After thorough testing, remove the entry_id column and entries table');
    } else {
      console.log('⚠️  Migration completed with warnings. Please check the data before proceeding.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the migration
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});