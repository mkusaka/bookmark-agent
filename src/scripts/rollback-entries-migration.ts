#!/usr/bin/env tsx
import { db } from '@/db';
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

async function checkMigrationState() {
  console.log('🔍 Checking migration state...\n');

  // Check if new columns exist
  const existingColumns = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'bookmarks' 
    AND column_name IN ('title', 'canonical_url', 'root_url', 'summary', 'normalized_domain')
  `);

  console.log(`Found ${existingColumns.rows.length} migration columns:`);
  existingColumns.rows.forEach((row: any) => {
    console.log(`   - ${row.column_name}`);
  });

  return existingColumns.rows.length > 0;
}

async function dropIndexes() {
  console.log('\n🔧 Dropping indexes...\n');

  const indexes = [
    'bookmarks_normalized_domain_idx',
    'bookmarks_title_trgm_idx',
    'bookmarks_summary_trgm_idx',
  ];

  for (const indexName of indexes) {
    try {
      console.log(`Dropping index: ${indexName}...`);
      await db.execute(sql`DROP INDEX IF EXISTS ${sql.identifier(indexName)}`);
      console.log(`   ✅ Dropped`);
    } catch (error) {
      console.log(`   ⚠️  Error dropping index (may not exist): ${error}`);
    }
  }
}

async function dropColumns() {
  console.log('\n📝 Dropping columns from bookmarks table...\n');

  try {
    await db.execute(sql`
      ALTER TABLE bookmarks 
      DROP COLUMN IF EXISTS title,
      DROP COLUMN IF EXISTS canonical_url,
      DROP COLUMN IF EXISTS root_url,
      DROP COLUMN IF EXISTS summary,
      DROP COLUMN IF EXISTS normalized_domain
    `);

    console.log('✅ Columns dropped successfully!\n');
  } catch (error) {
    console.error('❌ Error dropping columns:', error);
    throw error;
  }
}

async function verifyRollback() {
  console.log('🔍 Verifying rollback...\n');

  // Check that columns are gone
  const remainingColumns = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'bookmarks' 
    AND column_name IN ('title', 'canonical_url', 'root_url', 'summary', 'normalized_domain')
  `);

  if (remainingColumns.rows.length === 0) {
    console.log('✅ All migration columns have been removed successfully!');
    return true;
  } else {
    console.log('⚠️  Some columns still exist:');
    remainingColumns.rows.forEach((row: any) => {
      console.log(`   - ${row.column_name}`);
    });
    return false;
  }
}

async function main() {
  console.log('🔄 Bookmark-Entry Migration Rollback Tool\n');
  console.log('This tool will rollback the entry data migration.\n');
  console.log('⚠️  WARNING: This will remove the migrated columns and their data!\n');

  try {
    // Check if migration was applied
    const hasMigration = await checkMigrationState();

    if (!hasMigration) {
      console.log('\nℹ️  No migration columns found. Nothing to rollback.');
      process.exit(0);
    }

    // Confirm before proceeding
    const answer = await question('\nAre you sure you want to rollback the migration? (yes/no): ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('Rollback cancelled.');
      process.exit(0);
    }

    // Double confirm
    const confirm = await question('Type "ROLLBACK" to confirm: ');
    if (confirm !== 'ROLLBACK') {
      console.log('Rollback cancelled.');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Execute rollback
    await dropIndexes();
    await dropColumns();

    // Verify rollback
    const success = await verifyRollback();

    if (success) {
      console.log('\n🎉 Rollback completed successfully!');
      console.log('\nThe database has been restored to its original structure.');
      console.log('Entry data is still available in the entries table.');
    } else {
      console.log('\n⚠️  Rollback completed with warnings. Please check the database state.');
    }

  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the rollback
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});