#!/usr/bin/env tsx
/**
 * 超高速データ移行スクリプト
 * 単一のUPDATE文でJOINを使用して一括更新
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { bookmarks, entries } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function migrateEntryDataBulk() {
  console.log('🚀 Starting bulk entry data migration...\n');

  try {
    // 1. 現在の状態を確認
    console.log('📊 Checking current state...');
    
    const bookmarkStatsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN title IS NULL THEN 1 END) as without_title,
        COUNT(CASE WHEN title IS NULL AND entry_id IS NOT NULL THEN 1 END) as need_migration
      FROM ${bookmarks}
    `);
    const bookmarkStats = bookmarkStatsResult.rows[0] as {
      total: number;
      without_title: number;
      need_migration: number;
    };
    
    console.log(`Total bookmarks: ${bookmarkStats.total}`);
    console.log(`Bookmarks without title: ${bookmarkStats.without_title}`);
    console.log(`Bookmarks needing migration: ${bookmarkStats.need_migration}`);
    
    if (bookmarkStats.need_migration === 0) {
      console.log('\n✅ All bookmarks already have entry data. No migration needed.');
      return;
    }

    // 2. 単一のUPDATE文で全データを一括更新
    console.log('\n📋 Starting bulk update...');
    const startTime = Date.now();
    
    const result = await db.execute(sql`
      UPDATE ${bookmarks} b
      SET 
        title = e.title,
        canonical_url = e.canonical_url,
        root_url = e.root_url,
        summary = e.summary,
        normalized_domain = e.normalized_domain
      FROM ${entries} e
      WHERE 
        b.entry_id = e.id
        AND b.title IS NULL
    `);

    const totalTime = Date.now() - startTime;
    const migratedCount = result.rowCount || 0;

    // 3. 検証
    console.log('\n🔍 Verifying migration...');
    const verifyStatsResult = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN title IS NULL AND entry_id IS NOT NULL THEN 1 END) as still_missing
      FROM ${bookmarks}
    `);
    const verifyStats = verifyStatsResult.rows[0] as { still_missing: number };
    
    console.log('\n📊 Migration Statistics:');
    console.log(`  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`  Records migrated: ${migratedCount}`);
    if (migratedCount > 0) {
      console.log(`  Average time per record: ${(totalTime / migratedCount).toFixed(2)}ms`);
      console.log(`  Records/second: ${(migratedCount / (totalTime / 1000)).toFixed(0)}`);
    }
    
    if (verifyStats.still_missing === 0) {
      console.log(`\n✅ Migration completed successfully!`);
    } else {
      console.log(`\n⚠️  Migration completed with warnings. ${verifyStats.still_missing} bookmarks still missing data.`);
    }

    // 4. サンプルデータを表示
    console.log('\n📄 Sample migrated data:');
    const samples = await db.query.bookmarks.findMany({ limit: 3 });
    
    samples.forEach((bookmark, index) => {
      console.log(`\nBookmark ${index + 1}:`);
      console.log(`  Title: ${bookmark.title}`);
      console.log(`  URL: ${bookmark.url}`);
      console.log(`  Canonical URL: ${bookmark.canonicalUrl}`);
      console.log(`  Normalized Domain: ${bookmark.normalizedDomain}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 実行
migrateEntryDataBulk()
  .then(() => {
    console.log('\n🎉 Bulk migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });