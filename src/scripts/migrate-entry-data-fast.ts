#!/usr/bin/env tsx
/**
 * 高速データ移行スクリプト
 * バッチ更新を使用してentriesテーブルのデータをbookmarksテーブルに効率的にコピー
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { bookmarks, entries } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

async function migrateEntryDataFast() {
  console.log('🚀 Starting fast entry data migration...\n');

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

    // 2. バッチサイズを設定（大きくすると高速だがメモリ使用量が増える）
    const batchSize = 1000;
    console.log(`\n📋 Starting data migration with batch size: ${batchSize}`);
    
    let migratedCount = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < bookmarksWithNullTitle.length; i += batchSize) {
      const batch = bookmarksWithNullTitle.slice(i, i + batchSize);
      const batchStartTime = Date.now();
      
      // エントリーIDのリストを作成
      const entryIds = batch
        .filter(b => b.entryId)
        .map(b => b.entryId!);
      
      if (entryIds.length === 0) {
        console.warn(`⚠️  Batch ${i / batchSize + 1}: No valid entryIds found`);
        continue;
      }

      // バッチ内の全エントリーを一度に取得
      const entriesData = await db.query.entries.findMany({
        where: inArray(entries.id, entryIds),
      });

      // エントリーIDをキーとしたマップを作成
      const entryMap = new Map<string, typeof entriesData[0]>(
        entriesData.map(entry => [entry.id, entry])
      );

      // CASE文を使った一括更新クエリを構築
      const updateCases = {
        title: sql`CASE ${bookmarks.id}`,
        canonicalUrl: sql`CASE ${bookmarks.id}`,
        rootUrl: sql`CASE ${bookmarks.id}`,
        summary: sql`CASE ${bookmarks.id}`,
        normalizedDomain: sql`CASE ${bookmarks.id}`,
      };

      const bookmarkIds: string[] = [];
      
      for (const bookmark of batch) {
        if (!bookmark.entryId) continue;
        
        const entry = entryMap.get(bookmark.entryId);
        if (!entry) continue;

        bookmarkIds.push(bookmark.id);
        
        // 各フィールドのCASE文を構築
        updateCases.title = sql`${updateCases.title} WHEN ${bookmark.id} THEN ${entry.title}`;
        updateCases.canonicalUrl = sql`${updateCases.canonicalUrl} WHEN ${bookmark.id} THEN ${entry.canonicalUrl}`;
        updateCases.rootUrl = sql`${updateCases.rootUrl} WHEN ${bookmark.id} THEN ${entry.rootUrl}`;
        updateCases.summary = sql`${updateCases.summary} WHEN ${bookmark.id} THEN ${entry.summary}`;
        updateCases.normalizedDomain = sql`${updateCases.normalizedDomain} WHEN ${bookmark.id} THEN ${entry.normalizedDomain}`;
      }

      if (bookmarkIds.length === 0) {
        console.warn(`⚠️  Batch ${i / batchSize + 1}: No valid entries found for bookmarks`);
        continue;
      }

      // CASE文を完成させる
      updateCases.title = sql`${updateCases.title} END`;
      updateCases.canonicalUrl = sql`${updateCases.canonicalUrl} END`;
      updateCases.rootUrl = sql`${updateCases.rootUrl} END`;
      updateCases.summary = sql`${updateCases.summary} END`;
      updateCases.normalizedDomain = sql`${updateCases.normalizedDomain} END`;

      // 一括更新を実行
      await db
        .update(bookmarks)
        .set({
          title: updateCases.title,
          canonicalUrl: updateCases.canonicalUrl,
          rootUrl: updateCases.rootUrl,
          summary: updateCases.summary,
          normalizedDomain: updateCases.normalizedDomain,
        })
        .where(inArray(bookmarks.id, bookmarkIds));

      migratedCount += bookmarkIds.length;
      
      const batchTime = Date.now() - batchStartTime;
      const progress = Math.min(i + batchSize, bookmarksWithNullTitle.length);
      const percentage = Math.round((progress / bookmarksWithNullTitle.length) * 100);
      
      console.log(
        `Batch ${Math.floor(i / batchSize) + 1}: Updated ${bookmarkIds.length} bookmarks in ${batchTime}ms ` +
        `(Progress: ${progress}/${bookmarksWithNullTitle.length} - ${percentage}%)`
      );
    }

    const totalTime = Date.now() - startTime;
    const avgTimePerRecord = totalTime / migratedCount;

    // 3. 検証
    console.log('\n🔍 Verifying migration...');
    const verifyBookmarks = await db.query.bookmarks.findMany();
    const stillMissing = verifyBookmarks.filter(b => !b.title && b.entryId);
    
    console.log('\n📊 Migration Statistics:');
    console.log(`  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`  Records migrated: ${migratedCount}`);
    console.log(`  Average time per record: ${avgTimePerRecord.toFixed(2)}ms`);
    console.log(`  Records/second: ${(migratedCount / (totalTime / 1000)).toFixed(0)}`);
    
    if (stillMissing.length === 0) {
      console.log(`\n✅ Migration completed successfully!`);
    } else {
      console.log(`\n⚠️  Migration completed with warnings. ${stillMissing.length} bookmarks still missing data.`);
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
migrateEntryDataFast()
  .then(() => {
    console.log('\n🎉 Fast migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });