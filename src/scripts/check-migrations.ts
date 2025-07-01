import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function checkMigrations() {
  console.log('Checking migration status...\n');

  try {
    // Check __drizzle_migrations table
    const migrations = await db.execute(sql`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC
    `);

    console.log('Applied migrations:');
    migrations.rows.forEach((row: any) => {
      console.log(`- ID: ${row.id}, Hash: ${row.hash}, Applied: ${row.created_at}`);
    });

    // Check actual columns in bookmarks
    console.log('\nBookmarks table columns:');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookmarks'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkMigrations();