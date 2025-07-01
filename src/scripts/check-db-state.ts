import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function checkDatabaseState() {
  console.log('Checking database state...\n');

  try {
    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('Existing tables:');
    tables.rows.forEach((row: any) => {
      console.log(`  - ${row.tablename}`);
    });

    // Check bookmarks table columns
    console.log('\nBookmarks table columns:');
    const bookmarkColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookmarks'
      ORDER BY ordinal_position
    `);

    if (bookmarkColumns.rows.length > 0) {
      bookmarkColumns.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Table not found');
    }

    // Check entries table columns
    console.log('\nEntries table columns:');
    const entriesColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'entries'
      ORDER BY ordinal_position
    `);

    if (entriesColumns.rows.length > 0) {
      entriesColumns.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('  Table not found');
    }

  } catch (error) {
    console.error('Error checking database:', error);
  }

  process.exit(0);
}

checkDatabaseState();