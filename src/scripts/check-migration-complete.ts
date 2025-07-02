import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function check() {
  const result = await db.execute(sql`
    SELECT id, title, canonical_url, url
    FROM bookmarks
    LIMIT 3
  `);

  console.log('Sample bookmarks after migration:');
  result.rows.forEach((row, i: number) => {
    console.log(`\n📌 Bookmark ${i + 1}:`);
    console.log(`  ID: ${row.id}`);
    console.log(`  URL: ${row.url}`);
    console.log(`  Title: ${row.title}`);
    console.log(`  Canonical URL: ${row.canonical_url}`);
  });
  
  process.exit(0);
}

check();