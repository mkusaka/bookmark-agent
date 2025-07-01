#!/usr/bin/env tsx
/**
 * マイグレーションが完了しているか検証するスクリプト
 * notNull制約を追加する前に実行する
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function verifyMigrationComplete() {
  console.log('🔍 Verifying migration is complete...\n');

  try {
    // 1. NULLデータがないか確認
    console.log('📊 Checking for NULL values in new columns...');
    
    const nullCheckResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN title IS NULL THEN 1 END) as null_title,
        COUNT(CASE WHEN canonical_url IS NULL THEN 1 END) as null_canonical_url,
        COUNT(CASE WHEN root_url IS NULL THEN 1 END) as null_root_url,
        COUNT(CASE WHEN normalized_domain IS NULL THEN 1 END) as null_normalized_domain,
        COUNT(CASE WHEN entry_id IS NULL THEN 1 END) as null_entry_id
      FROM ${bookmarks}
    `);
    const stats = nullCheckResult.rows[0] as {
      total: number;
      null_title: number;
      null_canonical_url: number;
      null_root_url: number;
      null_normalized_domain: number;
      null_entry_id: number;
    };

    console.log(`Total bookmarks: ${stats.total}`);
    console.log(`  - NULL title: ${stats.null_title}`);
    console.log(`  - NULL canonical_url: ${stats.null_canonical_url}`);
    console.log(`  - NULL root_url: ${stats.null_root_url}`);
    console.log(`  - NULL normalized_domain: ${stats.null_normalized_domain}`);
    console.log(`  - NULL entry_id: ${stats.null_entry_id}`);

    // 2. summary以外のカラムでNULLがあるかチェック
    const hasNullValues = 
      stats.null_title > 0 ||
      stats.null_canonical_url > 0 ||
      stats.null_root_url > 0 ||
      stats.null_normalized_domain > 0;

    if (hasNullValues) {
      console.log('\n❌ Migration is NOT complete!');
      console.log('There are still NULL values in required columns.');
      console.log('Please run the migration script again.');
      
      // 詳細情報を表示
      if (stats.null_title > 0) {
        console.log('\n📝 Bookmarks with NULL title:');
        const nullTitleBookmarks = await db.execute(sql`
          SELECT id, url, entry_id 
          FROM ${bookmarks} 
          WHERE title IS NULL 
          LIMIT 5
        `);
        nullTitleBookmarks.rows.forEach((row: any) => {
          console.log(`  - ID: ${row.id}, URL: ${row.url}, Entry ID: ${row.entry_id}`);
        });
      }
      
      return false;
    }

    // 3. entry_idが全て存在するか確認
    if (stats.null_entry_id > 0) {
      console.log('\n⚠️  Warning: Some bookmarks have NULL entry_id');
      console.log('This might indicate orphaned bookmarks.');
    }

    console.log('\n✅ Migration verification passed!');
    console.log('All required columns have been populated.');
    console.log('\nYou can now proceed with:');
    console.log('1. Adding NOT NULL constraints to the columns');
    console.log('2. Removing the entry_id column');
    console.log('3. Dropping the entries table');

    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// 実行
verifyMigrationComplete()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });