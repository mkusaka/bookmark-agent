import { db } from '@/db';
import { entries } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { sql } from 'drizzle-orm';

async function migrateNormalizedDomain() {
  console.log('Starting normalized domain migration...');
  
  try {
    // Migrate entries table in batches
    console.log('Migrating entries table...');
    const batchSize = 1000;
    let offset = 0;
    let totalEntriesUpdated = 0;
    
    while (true) {
      const batch = await db
        .select({ id: entries.id, canonicalUrl: entries.canonicalUrl })
        .from(entries)
        .orderBy(entries.id)
        .limit(batchSize)
        .offset(offset);
      
      if (batch.length === 0) break;
      
      // Prepare bulk update data
      const updates = batch.map(entry => ({
        id: entry.id,
        normalizedDomain: normalizeDomain(entry.canonicalUrl)
      }));
      
      // Execute bulk update using CASE WHEN
      if (updates.length > 0) {
        let caseStatement = sql`CASE`;
        for (const update of updates) {
          caseStatement = sql`${caseStatement} WHEN id = ${update.id} THEN ${update.normalizedDomain}`;
        }
        caseStatement = sql`${caseStatement} END`;
        
        await db.execute(sql`
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
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateNormalizedDomain();