import { db } from '@/db';
import { entries, bookmarks } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { sql } from 'drizzle-orm';

async function migrateNormalizedDomain() {
  console.log('Starting normalized domain migration...');
  
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Migrate entries table in batches
      console.log('Migrating entries table...');
      const batchSize = 1000;
      let offset = 0;
      let totalEntriesUpdated = 0;
      
      while (true) {
        const batch = await tx
          .select({ id: entries.id, rootUrl: entries.rootUrl })
          .from(entries)
          .limit(batchSize)
          .offset(offset);
        
        if (batch.length === 0) break;
        
        // Prepare bulk update data
        const updates = batch.map(entry => ({
          id: entry.id,
          normalizedDomain: normalizeDomain(entry.rootUrl)
        }));
        
        // Execute bulk update using CASE WHEN
        if (updates.length > 0) {
          let caseStatement = sql`CASE`;
          for (const update of updates) {
            caseStatement = sql`${caseStatement} WHEN id = ${update.id} THEN ${update.normalizedDomain}`;
          }
          caseStatement = sql`${caseStatement} END`;
          
          await tx.execute(sql`
            UPDATE entries 
            SET normalized_domain = ${caseStatement}
            WHERE id IN (${sql.join(updates.map(u => u.id), sql`, `)})`
          );
          
          totalEntriesUpdated += batch.length;
          console.log(`Updated ${totalEntriesUpdated} entries...`);
        }
        
        offset += batchSize;
      }
      
      console.log(`Total entries updated: ${totalEntriesUpdated}`);
      
      // Migrate bookmarks table in batches
      console.log('Migrating bookmarks table...');
      offset = 0;
      let totalBookmarksUpdated = 0;
      
      while (true) {
        const batch = await tx
          .select({ id: bookmarks.id, url: bookmarks.url })
          .from(bookmarks)
          .limit(batchSize)
          .offset(offset);
        
        if (batch.length === 0) break;
        
        // Prepare bulk update data
        const updates = batch.map(bookmark => ({
          id: bookmark.id,
          normalizedDomain: normalizeDomain(bookmark.url)
        }));
        
        // Execute bulk update using CASE WHEN
        if (updates.length > 0) {
          let caseStatement = sql`CASE`;
          for (const update of updates) {
            caseStatement = sql`${caseStatement} WHEN id = ${update.id} THEN ${update.normalizedDomain}`;
          }
          caseStatement = sql`${caseStatement} END`;
          
          await tx.execute(sql`
            UPDATE bookmarks 
            SET normalized_domain = ${caseStatement}
            WHERE id IN (${sql.join(updates.map(u => u.id), sql`, `)})`
          );
          
          totalBookmarksUpdated += batch.length;
          console.log(`Updated ${totalBookmarksUpdated} bookmarks...`);
        }
        
        offset += batchSize;
      }
      
      console.log(`Total bookmarks updated: ${totalBookmarksUpdated}`);
    });
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateNormalizedDomain();