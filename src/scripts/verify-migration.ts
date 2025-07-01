import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { bookmarks } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');

  try {
    // Check bookmarks table columns
    console.log('📊 Bookmarks table structure:');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookmarks'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? '' : 'NOT NULL';
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
    });

    // Show sample data
    console.log('\n📄 Sample bookmark data:');
    const samples = await db
      .select()
      .from(bookmarks)
      .limit(1);

    if (samples.length > 0) {
      const sample = samples[0];
      console.log(`\nBookmark ID: ${sample.id}`);
      console.log(`Title: ${(sample as any).title || 'N/A'}`);
      console.log(`URL: ${sample.url}`);
      console.log(`Canonical URL: ${(sample as any).canonical_url || 'N/A'}`);
      console.log(`Domain: ${sample.domain}`);
      console.log(`Normalized Domain: ${(sample as any).normalized_domain || 'N/A'}`);
      console.log(`Comment: ${sample.comment}`);
      console.log(`Summary: ${(sample as any).summary || '(none)'}`);
      console.log(`Entry ID (to be removed): ${sample.entryId}`);
    }

    // Check indexes
    console.log('\n🔧 Indexes on bookmarks table:');
    const indexes = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'bookmarks'
      ORDER BY indexname
    `);

    indexes.rows.forEach((idx: any) => {
      console.log(`  - ${idx.indexname}`);
    });

  } catch (error) {
    console.error('Error during verification:', error);
  }

  process.exit(0);
}

verifyMigration();