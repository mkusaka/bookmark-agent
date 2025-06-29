import { db } from '@/db';
import { entries } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { sql } from 'drizzle-orm';

async function renormalizeAllDomains() {
  console.log('Starting re-normalization of all domains...');
  
  try {
    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries);
    
    console.log(`Total entries to process: ${totalCount[0].count}`);
    
    // Get sample of current entries
    const sampleEntries = await db
      .select()
      .from(entries)
      .limit(10);
    
    console.log('\nSample of current entries:');
    sampleEntries.forEach(entry => {
      const expected = normalizeDomain(entry.canonicalUrl);
      const needsUpdate = entry.normalizedDomain !== expected;
      console.log(`- Current: ${entry.normalizedDomain} (from ${entry.canonicalUrl})`);
      console.log(`  Expected: ${expected} ${needsUpdate ? '⚠️ NEEDS UPDATE' : '✓ OK'}`);
    });
    
    // Re-normalize ALL entries in batches
    console.log('\nRe-normalizing all entries...');
    const batchSize = 1000;
    let offset = 0;
    let totalUpdated = 0;
    
    while (true) {
      const batch = await db
        .select({ id: entries.id, canonicalUrl: entries.canonicalUrl })
        .from(entries)
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
        
        totalUpdated += batch.length;
        console.log(`Updated ${totalUpdated} entries...`);
      }
      
      offset += batchSize;
    }
    
    console.log(`\nTotal entries updated: ${totalUpdated}`);
    
    // Show sample of updated entries
    const updatedSampleEntries = await db
      .select()
      .from(entries)
      .limit(10);
    
    console.log('\nSample of updated entries:');
    updatedSampleEntries.forEach(entry => {
      console.log(`- ${entry.normalizedDomain} (from ${entry.canonicalUrl})`);
    });
    
    // Show unique normalized domains stats
    const uniqueDomains = await db
      .select({ count: sql<number>`count(DISTINCT ${entries.normalizedDomain})` })
      .from(entries);
    
    console.log(`\nTotal unique normalized domains: ${uniqueDomains[0].count}`);
    
    console.log('\nRe-normalization completed successfully!');
    
  } catch (error) {
    console.error('Re-normalization failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

renormalizeAllDomains();