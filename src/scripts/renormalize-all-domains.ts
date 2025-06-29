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
    
    // Re-normalize entries that need updates
    console.log('\nChecking and re-normalizing entries...');
    const batchSize = 1000;
    let offset = 0;
    let totalChecked = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    while (true) {
      const batch = await db
        .select({ 
          id: entries.id, 
          canonicalUrl: entries.canonicalUrl,
          normalizedDomain: entries.normalizedDomain 
        })
        .from(entries)
        .orderBy(entries.id)
        .limit(batchSize)
        .offset(offset);
      
      if (batch.length === 0) break;
      
      // Filter only entries that need updates
      const updates = batch
        .map(entry => {
          const expected = normalizeDomain(entry.canonicalUrl);
          return {
            id: entry.id,
            current: entry.normalizedDomain,
            expected: expected,
            needsUpdate: entry.normalizedDomain !== expected
          };
        })
        .filter(item => item.needsUpdate);
      
      totalChecked += batch.length;
      totalSkipped += batch.length - updates.length;
      
      // Execute bulk update only for entries that need it
      if (updates.length > 0) {
        let caseStatement = sql`CASE`;
        for (const update of updates) {
          caseStatement = sql`${caseStatement} WHEN id = ${update.id} THEN ${update.expected}`;
        }
        caseStatement = sql`${caseStatement} END`;
        
        await db.execute(sql`
          UPDATE entries 
          SET normalized_domain = ${caseStatement}
          WHERE id IN (${sql.join(updates.map(u => u.id), sql`, `)})`
        );
        
        totalUpdated += updates.length;
        console.log(`Checked ${totalChecked} | Updated ${totalUpdated} | Skipped ${totalSkipped}`);
      } else {
        console.log(`Checked ${totalChecked} | No updates needed in this batch`);
      }
      
      offset += batchSize;
    }
    
    console.log(`\n=== Final Summary ===`);
    console.log(`Total entries checked: ${totalChecked}`);
    console.log(`Total entries updated: ${totalUpdated}`);
    console.log(`Total entries skipped: ${totalSkipped}`);
    
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