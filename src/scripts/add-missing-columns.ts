import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function addMissingColumns() {
  console.log('Adding missing columns...\n');

  try {
    // Add markdown_content column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE bookmarks 
      ADD COLUMN IF NOT EXISTS markdown_content TEXT,
      ADD COLUMN IF NOT EXISTS markdown_fetched_at TIMESTAMP
    `);

    console.log('✅ Columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  }

  process.exit(0);
}

addMissingColumns();