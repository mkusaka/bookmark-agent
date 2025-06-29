import { db } from '@/db';
import { entries, bookmarks } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { sql } from 'drizzle-orm';

async function migrateNormalizedDomain() {
  console.log('Starting normalized domain migration...');
  
  try {
    // Migrate entries table
    console.log('Migrating entries table...');
    const allEntries = await db.select().from(entries);
    let entriesUpdated = 0;
    
    for (const entry of allEntries) {
      const normalizedDomain = normalizeDomain(entry.rootUrl);
      await db
        .update(entries)
        .set({ normalizedDomain })
        .where(sql`${entries.id} = ${entry.id}`);
      entriesUpdated++;
      
      if (entriesUpdated % 100 === 0) {
        console.log(`Updated ${entriesUpdated} entries...`);
      }
    }
    
    console.log(`Total entries updated: ${entriesUpdated}`);
    
    // Migrate bookmarks table
    console.log('Migrating bookmarks table...');
    const allBookmarks = await db.select().from(bookmarks);
    let bookmarksUpdated = 0;
    
    for (const bookmark of allBookmarks) {
      const normalizedDomain = normalizeDomain(bookmark.url);
      await db
        .update(bookmarks)
        .set({ normalizedDomain })
        .where(sql`${bookmarks.id} = ${bookmark.id}`);
      bookmarksUpdated++;
      
      if (bookmarksUpdated % 100 === 0) {
        console.log(`Updated ${bookmarksUpdated} bookmarks...`);
      }
    }
    
    console.log(`Total bookmarks updated: ${bookmarksUpdated}`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateNormalizedDomain();