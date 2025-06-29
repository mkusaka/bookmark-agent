import { db } from '@/db';
import { entries } from '@/db/schema';
import { normalizeDomain } from '@/lib/domain-normalizer';

async function checkDomainUpdatesNeeded() {
  console.log('Checking which entries need domain normalization updates...');
  
  try {
    const batchSize = 1000;
    let offset = 0;
    let totalNeedUpdate = 0;
    let totalUpToDate = 0;
    const samplesToShow: { current: string; expected: string; canonicalUrl: string }[] = [];
    
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
      
      for (const entry of batch) {
        const expected = normalizeDomain(entry.canonicalUrl);
        if (entry.normalizedDomain !== expected) {
          totalNeedUpdate++;
          if (samplesToShow.length < 10) {
            samplesToShow.push({
              current: entry.normalizedDomain,
              expected: expected,
              canonicalUrl: entry.canonicalUrl
            });
          }
        } else {
          totalUpToDate++;
        }
      }
      
      offset += batchSize;
      if (offset % 10000 === 0) {
        console.log(`Checked ${offset} entries...`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total entries checked: ${totalNeedUpdate + totalUpToDate}`);
    console.log(`Entries needing update: ${totalNeedUpdate}`);
    console.log(`Entries already up-to-date: ${totalUpToDate}`);
    
    if (samplesToShow.length > 0) {
      console.log('\nSample of entries needing update:');
      samplesToShow.forEach(sample => {
        console.log(`- Current: ${sample.current}`);
        console.log(`  Expected: ${sample.expected}`);
        console.log(`  URL: ${sample.canonicalUrl}`);
        console.log('');
      });
    }
    
    if (totalNeedUpdate > 0) {
      console.log(`\nRun "npm run db:renormalize-all-domains" to update these entries.`);
    } else {
      console.log('\nAll entries are already properly normalized! 🎉');
    }
    
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkDomainUpdatesNeeded();