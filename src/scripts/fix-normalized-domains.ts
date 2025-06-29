import { db } from '@/db';
import { entries } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';
import { sql } from 'drizzle-orm';

async function fixNormalizedDomains() {
  console.log('Starting to fix normalized domains...');
  
  try {
    // First, check how many entries have protocol in normalizedDomain
    const entriesWithProtocol = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(sql`${entries.normalizedDomain} LIKE 'http%'`);
    
    console.log(`Found ${entriesWithProtocol[0].count} entries with protocol in normalizedDomain`);
    
    // Get all entries to re-normalize
    const batchSize = 1000;
    let offset = 0;
    let totalUpdated = 0;
    let protocolFixed = 0;
    
    while (true) {
      const batch = await db
        .select({ 
          id: entries.id, 
          canonicalUrl: entries.canonicalUrl,
          normalizedDomain: entries.normalizedDomain 
        })
        .from(entries)
        .limit(batchSize)
        .offset(offset);
      
      if (batch.length === 0) break;
      
      console.log(`Processing batch at offset ${offset}...`);
      
      // Prepare updates
      const updates: Array<{ id: string; normalizedDomain: string; needsUpdate: boolean }> = [];
      
      for (const entry of batch) {
        const newNormalizedDomain = normalizeDomain(entry.canonicalUrl);
        const needsUpdate = entry.normalizedDomain !== newNormalizedDomain;
        
        if (needsUpdate) {
          updates.push({
            id: entry.id,
            normalizedDomain: newNormalizedDomain,
            needsUpdate: true
          });
          
          // Count how many had protocol issues
          if (entry.normalizedDomain.startsWith('http')) {
            protocolFixed++;
            console.log(`  Fixing: "${entry.normalizedDomain}" -> "${newNormalizedDomain}"`);
          }
        }
      }
      
      // Execute bulk update if there are changes
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
        
        totalUpdated += updates.length;
        console.log(`  Updated ${updates.length} entries in this batch`);
      }
      
      offset += batchSize;
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total entries processed: ${offset}`);
    console.log(`Total entries updated: ${totalUpdated}`);
    console.log(`Entries with protocol fixed: ${protocolFixed}`);
    
    // Verify no more entries with protocol
    const remainingWithProtocol = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(sql`${entries.normalizedDomain} LIKE 'http%'`);
    
    console.log(`\nEntries still with protocol: ${remainingWithProtocol[0].count}`);
    
    // Show sample of current normalized domains
    console.log('\nSample of normalized domains after fix:');
    const samples = await db
      .select({ 
        normalizedDomain: entries.normalizedDomain,
        canonicalUrl: entries.canonicalUrl 
      })
      .from(entries)
      .limit(10);
    
    samples.forEach(s => {
      console.log(`  ${s.normalizedDomain} <- ${s.canonicalUrl}`);
    });
    
    console.log('\nFix completed successfully!');
    
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixNormalizedDomains();