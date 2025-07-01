#!/usr/bin/env tsx
/**
 * データ移行スクリプト
 * entriesテーブルのデータをbookmarksテーブルの新しいカラムにコピーする
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { bookmarks, entries } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function migrateEntryData() {
  console.log('🚀 Starting entry data migration...\n');

  try {
    // 1. 現在の状態を確認
    console.log('📊 Checking current state...');
    
    const totalBookmarks = await db.query.bookmarks.findMany();
    console.log(`Total bookmarks: ${totalBookmarks.length}`);
    
    const bookmarksWithNullTitle = totalBookmarks.filter(b => !b.title);
    console.log(`Bookmarks without title (need migration): ${bookmarksWithNullTitle.length}`);
    
    if (bookmarksWithNullTitle.length === 0) {
      console.log('\n✅ All bookmarks already have entry data. No migration needed.');
      return;
    }

    // 2. バッチでデータを移行
    console.log('\n📋 Starting data migration...');
    let migratedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < bookmarksWithNullTitle.length; i += batchSize) {
      const batch = bookmarksWithNullTitle.slice(i, i + batchSize);
      
      for (const bookmark of batch) {
        if (!bookmark.entryId) {
          console.warn(`⚠️  Bookmark ${bookmark.id} has no entryId, skipping...`);
          continue;
        }

        // エントリーデータを取得
        const entry = await db.query.entries.findFirst({
          where: eq(entries.id, bookmark.entryId),
        });

        if (!entry) {
          console.warn(`⚠️  Entry ${bookmark.entryId} not found for bookmark ${bookmark.id}`);
          continue;
        }

        // bookmarkを更新
        await db
          .update(bookmarks)
          .set({
            title: entry.title,
            canonicalUrl: entry.canonicalUrl,
            rootUrl: entry.rootUrl,
            summary: entry.summary,
            normalizedDomain: entry.normalizedDomain,
          })
          .where(eq(bookmarks.id, bookmark.id));

        migratedCount++;
      }
      
      console.log(`Progress: ${Math.min(i + batchSize, bookmarksWithNullTitle.length)}/${bookmarksWithNullTitle.length}`);
    }

    // 3. 検証
    console.log('\n🔍 Verifying migration...');
    const verifyBookmarks = await db.query.bookmarks.findMany();
    const stillMissing = verifyBookmarks.filter(b => !b.title && b.entryId);
    
    if (stillMissing.length === 0) {
      console.log(`✅ Migration completed successfully! ${migratedCount} bookmarks updated.`);
    } else {
      console.log(`⚠️  Migration completed with warnings. ${migratedCount} bookmarks updated, ${stillMissing.length} still missing data.`);
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
migrateEntryData()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });